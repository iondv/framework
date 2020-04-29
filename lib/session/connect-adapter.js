const util = require('util');
const Store = require('express-session').Store;
const DsStore = require('./dsStore');

/**
 * @param {{}} session
 * @param {DataSource} dataSource
 * @param {String} type
 * @param {{}} storeOptions
 * @returns {Store|BackedStore}
 */
// eslint-disable-next-line complexity, max-statements
module.exports = (session, dataSource, type, storeOptions) => {
  storeOptions = storeOptions || {};
  const opts = Object.assign({}, storeOptions.options);
  opts.ttl = opts.ttl || 14 * 24 * 60 * 60;
  const dsStorage = new DsStore(dataSource, opts);
  switch (type) {
    case 'mongodb':
    case 'db': {
      return dsStorage;
    }
    case 'memcached': {
      const mc = require('connect-memcached');
      const MemcachedStore = mc(session);
      const opts = Object.assign({}, storeOptions.options);
      opts.ttl = opts.ttl || 14 * 24 * 60 * 60;
      opts.hosts = opts.hosts || ['localhost:11211'];
      const mcStore = new MemcachedStore(opts);
      return new BackedStore(mcStore, dsStorage, {passThrough: storeOptions.passThrough});
    }
    case 'redis': {
      const rc = require('connect-redis');
      const RedisStore = rc(session);
      const opts = Object.assign({}, storeOptions.options);
      opts.ttl = opts.ttl || 14 * 24 * 60 * 60;
      opts.host = opts.host || 'localhost';
      opts.port = opts.port || '6379';
      const rStore = new RedisStore(opts);
      return new BackedStore(rStore, dsStorage, {passThrough: storeOptions.passThrough});
    }
    default: throw new Error('Указан неподдерживаемый тип хранилища сессий!');
  }
};

/**
 * @param {Store} store
 * @param {Store} backStore
 * @param {{}} options
 * @constructor
 */
function BackedStore(store, backStore, options) {
  Store.call(this, {});

  options = options || {};
  const passThrough = Boolean(options.passThrough);
  let storeReady = true;

  store.on('disconnect', () => {
    storeReady = false;
  });

  store.on('connect', () => {
    storeReady = true;
  });

  backStore.on('disconnect', err => this.emit('disconnect', err));
  backStore.on('connect', () => this.emit('connect'));

  /**
   * @param {Function} cb
   * @public
   */
  this.all = (cb) => {
    if (storeReady) {
      store.all(cb);
    } else {
      backStore.all(cb);
    }
  };

  /**
   * @param {String} sid
   * @param {Function} cb
   * @public
   */
  this.destroy = (sid, cb) => {
    if (storeReady) {
      store.destroy(sid, cb);
    } else {
      backStore.destroy(sid, cb);
    }
  };

  /**
   * @param {Function} cb
   * @public
   */
  this.clear = (cb) => {
    if (storeReady) {
      store.clear(cb);
    } else {
      backStore.clear(cb);
    }
  };

  /**
   * @param {Function} cb
   * @public
   */
  this.length = (cb) => {
    if (storeReady) {
      store.length(cb);
    } else {
      backStore.length(cb);
    }
  };

  /**
   * @param {String} sid
   * @param {Function} cb
   * @public
   */
  this.get = (sid, cb) => {
    if (storeReady) {
      store.get(sid, cb);
    } else {
      backStore.get(sid, cb);
    }
  };

  /**
   * @param {String} sid
   * @param {{}} session
   * @param {Function} cb
   * @public
   */
  this.set = (sid, session, cb) => {
    if (storeReady) {
      store.set(sid, session, (...args) => {
        passThrough ? backStore.set(sid, session, cb) : cb(...args);
      });
    } else {
      backStore.set(sid, session, cb);
    }
  };

  /**
   * @param {String} sid
   * @param {{}} session
   * @param {Function} cb
   * @public
   */
  this.touch = (sid, session, cb) => {
    if (storeReady) {
      store.touch(sid, session, cb);
    } else {
      backStore.touch(sid, session, cb);
    }
  };
}

util.inherits(BackedStore, Store);
