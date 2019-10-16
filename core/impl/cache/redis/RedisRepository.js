/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 10/9/16.
 */
'use strict';

const Repository = require('core/interfaces/Repository');
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

  const log = config.logger || new LoggerProxy();

  const rHost = config.host || 'localhost';
  const rPort = config.port || '6379';
  const lifetime = config.lifetime || 60;
  let client = null;
  let available = false;

  /**
   *
   * @param {String} key
   * @returns {Promise}
   * @private
   */
  this._get = function (key) {
    if (!client || !available) {
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      client.get(key, (err, reply) => {
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
    if (!client || !available) {
      return Promise.resolve();
    }
    try {
      client.set(key, JSON.stringify(value), 'EX', lifetime);
    } finally {
      return Promise.resolve();
    }
  };

  this.init = function () {
    if (!config.enabled) {
      return Promise.resolve();
    }
    log.info('Redis initialization');
    const redisOptions = {host: rHost, port: rPort};
    if (config.connectOptions) {
      for (let p in config.connectOptions) {
        if (config.connectOptions.hasOwnProperty(p)) {
          redisOptions[p] = config.connectOptions[p];
        }
      }
    }
    client = redis.createClient(redisOptions);
    return new Promise((resolve) => {
      client.on('ready', () => {
        log.info('Redis connected');
        available = true;
        resolve();
      });
      client.on('error', (err) => {
        available = false;
        log.error(err);
        resolve();
      });
    });
  };
}

RedisRepository.prototype = new Repository();
module.exports = RedisRepository;
