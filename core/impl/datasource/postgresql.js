const DataSource = require('core/interfaces/DataSource');
const { Pool } = require('pg');
const LoggerProxy = require('core/impl/log/LoggerProxy');
const clone = require('fast-clone');
const fs = require('fs');

/**
 * @param {Object} config
 * @param {*} config.logger
 * @param {Object} config.options
 * @param {String} config.options.user
 * @param {String} config.options.database
 * @param {String} config.options.password
 * @param {Number} config.options.port
 * @param {String} config.options.host
 * @param {String} config.options.connectionString
 * @param {Boolean} config.options.keepAlive
 * @param {stream.Duplex} config.options.stream
 * @param {False|Number} config.options.statement_timeout
 * @param {Boolean} config.options.parseInputDatesAsUTC
 * @param {Boolean|ConnectionOptions} config.options.ssl
 * @param {Number} config.options.query_timeout
 * @param {Number} config.options.keepAliveInitialDelayMillis
 * @param {Number} config.options.max
 * @param {Number} config.options.min
 * @param {Number} config.options.connectionTimeoutMillis
 * @param {Number} config.options.idleTimeoutMillis
 * @param {(...messages: any[]) => void} config.options.log
 * @param {String} config.options.application_name
 * @param {PromiseConstructorLike} config.options.Promise
 */
function PostgreSQL(config) {
  const _this = this;
  const log = config.logger || new LoggerProxy();

  this.pool = null;

  /**
   * @param {String[]|String} opts
   */
  const readFiles = (opts) => {
    if (Array.isArray(opts)) {
      let result = Promise.resolve();
      const vs = [];
      opts.forEach((val) => {
        result = result
          .then(() => readFiles(val))
          .then(data => vs.push(data));
      });
      return result.then(() => vs);
    }
    return new Promise((res, rej) => fs.readFile(opts, (err, data) => {
      if (err)
        return rej(err);
      return res(data);
    }));
  };

  /**
   * @returns {*}
   */
  this._connection = () => {
    if (_this.pool)
      return _this.pool.connect();
    return Promise.resolve(false);
  };

  /**
   * @returns {Promise}
   */
  this._open = () => {
    let result = Promise.resolve(true);
    if (!_this.pool) {
      const opts = clone(config.options);
      if (opts.ssl) {
        if (opts.ssl.ca) {
          result = result
            .then(() => readFiles(opts.ssl.ca))
            .then((bufs) => {opts.ssl.ca = bufs;});
        }
        if (opts.ssl.key) {
          result = result
            .then(() => readFiles(opts.ssl.key))
            .then((bufs) => {opts.ssl.key = bufs;});
        }
        if (opts.ssl.cert) {
          result = result
            .then(() => readFiles(opts.ssl.cert))
            .then((bufs) => {opts.ssl.cert = bufs;});
        }
      }
      return result.then(() => {
        _this.pool = new Pool(opts);
        return true;
      });
    }
    return result;
  };

  /**
   * @returns {Promise}
   */
  this._close = () => {
    if (_this.pool) {
      return _this.pool.end().then((result) => {
        _this.pool = null;
        return result;
      });
    }
    return Promise.resolve();
  };
}

PostgreSQL.prototype = new DataSource();

module.exports = PostgreSQL;
