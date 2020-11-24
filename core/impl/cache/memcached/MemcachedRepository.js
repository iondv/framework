/**
 * Created by inkz on 10/3/16.
 */
'use strict';

var Repository = require('core/interfaces/Repository');
var Memcached = require('memcached');
var LoggerProxy = require('core/impl/log/LoggerProxy');
const {t} = require('core/i18n');
const {format} = require('util');

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

  const log = config.logger || new LoggerProxy();

  const mServerLocations = [];
  if (Array.isArray(config.serverLocations)) {
    for (let i = 0; i < config.serverLocations.length; i++) {
      if (config.serverLocations[i]) {
        mServerLocations.push(config.serverLocations[i]);
      }
    }
  }

  if (!mServerLocations.length) {
    mServerLocations.push('localhost:11211');
  }

  const mOptions = config.connectOptions || {};
  const lifeTime = config.lifetime || 3600;
  const reconnectTimeout = config.reconnectTimeout || 30;
  let memcached = null;
  let availableServers = mServerLocations.concat([]);
  let checkingForServers = false;

  function afterConnect(cb) {
    return function () {
      log.info(t('Memcached servers accessibility check done.'));
      setTimeout(() => {
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
      const connectors = [];

      memcached.multi(false, (server) => {
        connectors.push(new Promise((resolve) => {
          memcached.connect(server, (err, conn) => {
            if (!err) {
              if (conn.readable && conn.writable && availableServers.indexOf(server) < 0) {
                availableServers.push(server);
              }
            } else {
              log.warn(format(t('Memcached server %s is not accessible.'), server));
            }
            resolve();
          });
        }));
      });

      const ac = afterConnect(cb);
      Promise.all(connectors).then(ac).catch(ac);
    }
  }

  /**
   * @param {String} key
   * @returns {Promise}
   * @private
   */
  this._get = function (key) {
    return new Promise((resolve) => {
      if (memcached && availableServers.length) {
        memcached.get(key, (err, data) => {
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
    return new Promise((resolve) => {
      if (memcached && availableServers.length) {
        memcached.set(key, value, lifeTime, () => {
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
    return value => value !== server;
  }

  this.init = function () {
    return new Promise((resolve, reject) => {
      if (!config.enabled) {
        return resolve();
      }
      try {
        log.log(t('Memcached repository initialization...'));
        memcached = new Memcached(mServerLocations, mOptions);
        memcached
          .on('issue', (details) => {
            availableServers = availableServers.filter(filterUnavailableServer(details.server));
            log.warn(`Memcached issue:${details.server}:${details.messages.join(' ')}`);
          })
          .on('failure', (details) => {
            availableServers = availableServers.filter(filterUnavailableServer(details.server));
            log.warn(`Memcached failure:${details.server}:${details.messages.join(' ')}`);
          })
          .on('reconnecting', (details) => {
            log.warn(`Memcached reconnecting:${details.server}:${details.messages.join(' ')}`);
          })
          .on('reconnect', (details) => {
            if (availableServers.indexOf(details.server) < 0) {
              availableServers.push(details.server);
            }
            log.warn(`Memcached reconnect:${details.server}:${details.messages.join(' ')}`);
          })
          .on('remove', (details) => {
            log.warn(`Memcached remove:${details.server}:${details.messages.join(' ')}`);
          });
        checkAvailableServers(resolve);
      } catch (err) {
        reject(err);
      }
    });
  };
}

MemcachedRepository.prototype = new Repository();
module.exports = MemcachedRepository;
