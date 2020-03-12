const DataSource = require('core/interfaces/DataSource');
const { Pool } = require('pg');
const LoggerProxy = require('core/impl/log/LoggerProxy');
const clone = require('fast-clone');
const fs = require('fs');

/**
 * @param {*} config
 * @param {*} config.logger
 * @param {*} config.options
    user?: string;
    database?: string;
    password?: string;
    port?: number;
    host?: string;
    connectionString?: string;
    keepAlive?: boolean;
    stream?: stream.Duplex;
    statement_timeout?: false | number;
    parseInputDatesAsUTC?: boolean;
    ssl?: boolean | ConnectionOptions;
    query_timeout?: number;
    keepAliveInitialDelayMillis?: number;
    max?: number;
    min?: number;
    connectionTimeoutMillis?: number;
    idleTimeoutMillis?: number;
    log?: (...messages: any[]) => void;
    application_name?: string;
    Promise?: PromiseConstructorLike;
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
    return Promise.resolve();
  };

  /**
   * @returns {Promise}
   */
  this._open = () => {
    let result = Promise.resolve();
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
        _this.pool.on('connect', client => log.info('connect'));
        _this.pool.on('acquire', client => log.info('acquire'));
        _this.pool.on('error', (err, client) => log.error(err));
        _this.pool.on('remove', client => log.info('remove'));
      });
    }
    return Promise.resolve();
  };

  /**
   * @returns {Promise}
   */
  this._close = () => {
    if (_this.pool) {
      return _this.pool.end();
    }
    return Promise.resolve();
  };
}

PostgreSQL.prototype = new DataSource();

module.exports = PostgreSQL;
