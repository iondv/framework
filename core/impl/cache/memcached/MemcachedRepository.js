/**
 * Created by inkz on 10/3/16.
 */
'use strict';

var CacheRepository = require('core/interfaces/CacheRepository');
var Memcached = require('memcached');
var LoggerProxy = require('core/impl/log/LoggerProxy');

/**
 * @param {{}} config
 * @param {String[]} config.serverLocations
 * @param {{}} config.connectOptions
 * @param {Number} config.lifetime
 * @param {Boolean} config.enabled
 * @param {Number} [config.reconnectTimeout]
 * @param {Logger} [config.logger]
 * @constructor
 */
function MemcachedRepository(config) {

  var log = config.logger || new LoggerProxy();

  var mServerLocations = [];
  if (Array.isArray(config.serverLocations)) {
    for (var i = 0; i < config.serverLocations.length; i++) {
      if (config.serverLocations[i]) {
        mServerLocations.push(config.serverLocations[i]);
      }
    }
  }

  if (!mServerLocations.length) {
    mServerLocations.push('localhost:11211');
  }

  var mOptions = config.connectOptions || {};
  var lifeTime = config.lifetime || 3600;
  var reconnectTimeout = config.reconnectTimeout || 30;
  var memcached = null;
  var availableServers = mServerLocations.concat([]);
  var checkingForServers = false;

  function afterConnect(cb) {
    return function () {
      log.info('Выполнена проверка доступности серверов memcached.');
      setTimeout(function () {
        checkingForServers = false;
      }, reconnectTimeout * 1000);
      if (typeof cb === 'function') {
        cb();
      }
    };
  }

  function checkAvailableServers(cb) {
    if (!checkingForServers) {
      checkingForServers = true;
      var connectors = [];

      memcached.multi(false, function (server, key, index, totals) {
        connectors.push(new Promise(function (resolve, reject) {
          memcached.connect(server, function (err, conn) {
            if (!err) {
              if (conn.readable && conn.writable && availableServers.indexOf(server) < 0) {
                availableServers.push(server);
              }
            } else {
              log.warn('Сервер memcached ' + server + ' недоступен.');
            }
            resolve();
          });
        }));
      });

      var ac = afterConnect(cb);
      Promise.all(connectors)
        .then(ac).catch(ac);
    }
  }

  /**
   * @param {String} key
   * @returns {Promise}
   * @private
   */
  this._get = function (key) {
    return new Promise(function (resolve, reject) {
      if (memcached && availableServers.length) {
        memcached.get(key, function (err, data) {
          if (err) {
            return resolve();
          }
          resolve(data);
        });
      } else {
        if (memcached) {
          checkAvailableServers();
        }
        resolve(null);
      }
    });
  };

  /**
   * @param {String} key
   * @param {*} value
   * @returns {Promise}
   * @private
   */
  this._set = function (key, value) {
    return new Promise(function (resolve, reject) {
      if (memcached && availableServers.length) {
        memcached.set(key, value, lifeTime, function (err) {
          resolve();
        });
      } else {
        if (memcached) {
          checkAvailableServers();
        }
        resolve();
      }
    });
  };

  function filterUnavailableServer(server) {
    return function (value) {
      return value !== server;
    };
  }

  this.init = function () {
    return new Promise(function (resolve, reject) {
      if (!config.enabled) {
        return resolve();
      }
      try {
        log.log('Инициализация memcached...');
        memcached = new Memcached(mServerLocations, mOptions);
        memcached.
        on('issue',
          function (details) {
            availableServers = availableServers.filter(filterUnavailableServer(details.server));
            log.warn(`Memcached issue:${details.server}:${details.messages.join(' ')}`);
          }
        ).
        on('failure',
          function (details) {
            availableServers = availableServers.filter(filterUnavailableServer(details.server));
            log.warn(`Memcached failure:${details.server}:${details.messages.join(' ')}`);
          }
        ).
        on('reconnecting',
          function (details) {
            log.warn(`Memcached reconnecting:${details.server}:${details.messages.join(' ')}`);
          }
        ).
        on('reconnect',
          function (details) {
            if (availableServers.indexOf(details.server) < 0) {
              availableServers.push(details.server);
            }
            log.warn(`Memcached reconnect:${details.server}:${details.messages.join(' ')}`);
          }
        ).
        on('remove',
          function (details) {
            log.warn(`Memcached remove:${details.server}:${details.messages.join(' ')}`);
          }
        );
        checkAvailableServers(resolve);
      } catch (err) {
        reject(err);
      }
    });
  };
}

MemcachedRepository.prototype = new CacheRepository();
module.exports = MemcachedRepository;
