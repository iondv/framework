/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 10/9/16.
 */
'use strict';

const CacheRepository = require('core/interfaces/CacheRepository');
const redis = require('redis');
var LoggerProxy = require('core/impl/log/LoggerProxy');

/**
 *
 * @param {{host: String, port: String, enabled: Boolean}} config
 * @param {{}} [config.connectOptions]
 * @param {Logger} [config.logger]
 * @constructor
 */
function RedisRepository(config) {

  var log = config.logger || new LoggerProxy();

  var rHost = config.host || 'localhost';
  var rPort = config.port || '6379';
  var lifetime = config.lifetime || 60;
  var client = null;
  var available = false;

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
        client.set(key, JSON.stringify(value), 'EX', lifetime);
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
        log.info('Инициализация Redis');
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
          log.info('Redis подключен');
          available = true;
          resolve();
        });
        client.on('error', function (err) {
          available = false;
          log.error('Redis error: ' + err);
          resolve();
        });
      } catch (err) {
        reject(err);
      }
    });
  };
}

RedisRepository.prototype = new CacheRepository();
module.exports = RedisRepository;
