/**
 * Created by inkz on 10/3/16.
 */
'use strict';

var CacheRepository = require('core/interfaces/CacheRepository');
var Memcached = require('memcached');

/**
 * @param {{serverLocations: String[], connectOptions: {}, lifetime: Number, enabled: Boolean}} config
 * @param {Logger} [config.log]
 * @constructor
 */
function MemcachedRepository(config) {

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
  var memcached = null;
  var availableServers = mServerLocations.concat([]);

  function log(msg) {
    if (config.log) {
      config.log.log(msg);
    } else {
      console.log(msg);
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
        memcached.set(key, value, lifeTime, function () {
          resolve();
        });
      } else {
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
        log('Инициализация memcached');
        memcached = new Memcached(mServerLocations, mOptions);
        memcached.
        on('issue',
          function (details) {
            availableServers = availableServers.filter(filterUnavailableServer(details.server));
            log('Memcached issue:' + details.server + ':' + details.messages.join(' '));
          }
        ).
        on('failure',
          function (details) {
            availableServers = availableServers.filter(filterUnavailableServer(details.server));
            log('Memcached failure:' + details.server + ':' + details.messages.join(' '));
          }
        ).
        on('reconnecting',
          function (details) {
            log('Memcached reconnecting:' + details.server + ':' + details.messages.join(' '));
          }
        ).
        on('reconnect',
          function (details) {
            if (availableServers.indexOf(details.server) < 0) {
              availableServers.push(details.server);
            }
            log('Memcached reconnect:' + details.server + ':' + details.messages.join(' '));
          }
        ).
        on('remove',
          function (details) {
            log('Memcached remove:' + details.server + ':' + details.messages.join(' '));
          }
        );
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  };
}

MemcachedRepository.prototype = new CacheRepository();
module.exports = MemcachedRepository;
