/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 10/9/16.
 */
'use strict';

const CacheRepository = require('core/interfaces/CacheRepository');
const redis = require('redis');

/**
 *
 * @param {{host: String, port: String, enabled: Boolean}} config
 * @param {{}} [config.connectOptions]
 * @param {Logger} [config.log]
 * @constructor
 */
function RedisRepository(config) {

  var rHost = config.host || 'localhost';
  var rPort = config.port || '6379';
  var client = null;
  var available = false;

  function log(msg) {
    if (config.log) {
      config.log.log(msg);
    } else {
      console.log(msg);
    }
  }

  /**
   *
   * @param {String} key
   * @returns {Promise}
   * @private
   */
  this._get = function (key) {
    return new Promise(function (resolve) {
      if (!client || !available) {
        return resolve(null);
      }
      client.get(key, function (err, reply) {
        try {
          var value = reply ? JSON.parse(reply.toString()) : null;
          resolve(value);
        } catch (err) {
          resolve(null);
        }
      });
    });
  };

  /**
   *
   * @param {String} key
   * @param {*} value
   * @returns {Promise}
   * @private
   */
  this._set = function (key, value) {
    return new Promise(function (resolve) {
      if (!client || !available) {
        return resolve();
      }
      try {
        client.set(key, JSON.stringify(value));
      } finally {
        resolve();
      }
    });
  };

  this.init = function () {
    return new Promise(function (resolve, reject) {
      if (!config.enabled) {
        return resolve();
      }
      try {
        log('Инициализация Redis');
        var redisOptions = {host: rHost, port: rPort};
        if (config.connectOptions) {
          for (var p in config.connectOptions) {
            if (config.connectOptions.hasOwnProperty(p)) {
              redisOptions[p] = config.connectOptions[p];
            }
          }
        }
        client = redis.createClient(redisOptions);
        client.on('ready', function () {
          available = true;
        });
        client.on('error', function (err) {
          available = false;
          log('Redis error: ' + err);
        });
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  };
}

RedisRepository.prototype = new CacheRepository();
module.exports = RedisRepository;
