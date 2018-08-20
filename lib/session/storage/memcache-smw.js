const session = require('express-session');
const mc = require('connect-memcached');

/**
 * @param {{}} options
 * @param {Array} options.hosts
 * @param {Number} [options.ttl]
 * @constructor
 */
function MemcacheSessionStorage(options) {

  let smw = null;

  /**
   * @param {{}} sessOpts
   * @returns {Promise}
   */
  this.getMiddleware = (sessOpts) => {
    if (!smw) {
      try {
        let MemcachedStore = mc(session);
        let opts = Object.assign({}, options);
        opts.ttl = opts.ttl || 14 * 24 * 60 * 60;
        opts.hosts = opts.hosts || ['localhost:11211'];
        sessOpts = sessOpts || {};
        sessOpts.store = new MemcachedStore(opts);
        smw = session(sessOpts);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    return Promise.resolve(smw);
  };

}

module.exports = MemcacheSessionStorage;
