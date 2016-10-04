/**
 * Created by inkz on 10/3/16.
 */
'use strict';

var CacheRepository = require('core/interfaces/CacheRepository');
var Memcached = require('memcached');

function MemcachedRepository(config) {

  var mServerLocations = config.serverLocations || ['localhost'];
  var mOptions = config.connectOptions || {};
  var lifeTime = config.lifetime || 3600;
  var memcached = new Memcached(mServerLocations,mOptions);
  
  memcached.on('issue',function(details){ console.log('Memcahced issue:'+details.server+":"+details.messages.join(" ")); });
  memcached.on('failure',function(details){ console.log('Memcahced failure:'+details.server+":"+details.messages.join(" ")); });
  memcached.on('reconnecting',function(details){ console.log('Memcahced reconnecting:'+details.server+":"+details.messages.join(" ")); });
  memcached.on('reconnect',function(details){ console.log('Memcahced reconnect:'+details.server+":"+details.messages.join(" ")); });
  memcached.on('remove',function(details){ console.log('Memcahced remove:'+details.server+":"+details.messages.join(" ")); });
 
  this._get = function(key) {
    return new Promise(function(resolve, reject){
      if (memcached) {
        memcached.get(key, function(err, data){
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      } else {
        reject();
      }
    });
  };

  this._set = function(key, value) {
    return new Promise(function(resolve, reject){
      if (memcached) {
        memcached.set(key, value, lifeTime, function(err){
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } else {
        reject();
      }
    });
  };
}

MemcachedRepository.prototype = new CacheRepository();
module.exports = MemcachedRepository;
