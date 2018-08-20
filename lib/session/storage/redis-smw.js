const session = require('express-session');
const rc = require('connect-redis');

/**
 * @param {{}} options
 * @param {String} options.host
 * @param {Number} options.port
 * @param {Number} [options.ttl]
 * @constructor
 */
function RedisSessionStorage(options) {

  let smw = null;

  /**
   * @param {{}} sessOpts
   * @returns {Promise}
   */
  this.getMiddleware = (sessOpts) => {
    if (!smw) {
      try {
        let RedisStore = rc(session);
        let opts = Object.assign({}, options);
        opts.ttl = opts.ttl || 14 * 24 * 60 * 60;
        opts.host = opts.host || 'localhost';
        opts.port = opts.port || '6379';
        sessOpts = sessOpts || {};
        sessOpts.store = new RedisStore();
        smw = session(sessOpts);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    return Promise.resolve(smw);
  };

}

module.exports = RedisSessionStorage;
