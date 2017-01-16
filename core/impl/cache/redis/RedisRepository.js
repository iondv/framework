/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 10/9/16.
 */
'use strict';

const CacheRepository = require('core/interfaces/CacheRepository');
const redis = require('redis');

/**
 *
 * @param {{host: String, port: String, enabled: Boolean}} config
 * @param {Logger} [config.log]
 * @constructor
 */
function RedisRepository(config) {

  var rHost = config.host || 'localhost';
  var rPort = config.port || '6379';
  var client = null;

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
    return new Promise(function (resolve,reject) {
      if (!client) {
        resolve(null);
      }
      client.get(key, function (err, reply) {
        if (err) {
          reject(err);
        } else if (reply) {
          try {
            var value = JSON.parse(reply.toString());
            resolve(value);
          } catch (err) {
            reject(err);
          }
        } else {
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
    return new Promise(function (resolve, reject) {
      if (!client) {
        resolve();
      }
      try {
        client.set(key, JSON.stringify(value));
        resolve();
      } catch (err) {
        reject(err);
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
        client = redis.createClient({host: rHost, port: rPort});
        client.on('error', function (err) {
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
