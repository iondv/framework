/**
 * Created by inkz on 10/4/16.
 */

var chai = require('chai');
var assert = chai.assert;
var should = chai.should;

var servers = ['localhost:11211'];
var memcachedOptions = {};
var MemcacheRepo = require('core/impl/cache/memcached/MemcachedRepository');
var cache = new MemcacheRepo({serverLocations:servers, connectOptions:memcachedOptions});

describe('testing CacheRepository', function(){

  it('testing SET method',function(){
    return cache.set(1,"hello world");
  });

  it('testing GET method',function(){
    cache.get(1).then(function(data){
      assert.isDefined(data);
    });
  });
});

