/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 10/9/16.
 */
'use strict';

var CacheRepository = require('core/interfaces/CacheRepository');
var redis = require('redis');

/**
 *
 * @param {Object} config
 * @constructor
 */
function RedisRepository(config) {

  var rHost = config.host || 'localhost';
  var rPort = config.port || '6379';
  var client = redis.createClient({host: rHost,port: rPort});

  client.on('error', function (err) {
    console.log('Error ' + err);
  });

  /**
   *
   * @param {String} key
   * @returns {Promise}
   * @private
   */
  this._get = function (key) {
    return new Promise(function (resolve,reject) {
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
      try {
        client.set(key, JSON.stringify(value));
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  };
}

RedisRepository.prototype = new CacheRepository();
module.exports = RedisRepository;
