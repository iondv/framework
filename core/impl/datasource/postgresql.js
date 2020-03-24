/* eslint-disable max-statements */

const DataSource = require('core/interfaces/DataSource');
const { Pool } = require('pg');
const LoggerProxy = require('core/impl/log/LoggerProxy');
const clone = require('fast-clone');
const fs = require('fs');
const Errors = require('core/errors/data-source');
const SqlAdapter = require('core/impl/datasource/sql');
const Operations = require('core/FunctionCodes');
const cuid = require('cuid');

/**
 * @param {Object} config
 * @param {*} config.logger
 * @param {Boolean} cofig.queryLogging
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
  const sql = new SqlAdapter({
    logCallback: result => config.queryLogging && log.log(JSON.stringify(result)),
    result: ({text, params}) => Object({text, values: params}),
    structuredField: (field, parts) => `(${field}#>'{${parts.join(',')}}'`,
    select: (table, options, parts, params) => {
      const {
        select, joins, where, groupBy, orderBy
      } = parts;
      const limit = options.count ? `LIMIT ${options.count}` : '';
      return {
        text: `SELECT ${select} FROM ${table} ${joins} ${where} ${groupBy} ${orderBy} ${limit};`,
        params
      };
    }
  });

  this.pool = null;

  const wrapError = (error) => {
    //TODO
    throw error;
  };

  const processData = (data) => {
    //TODO
    return data;
  };

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

  const execute = cb => _this.pool.connect()
    .then(client => cb(client).finally(() => client.release()))
    .catch(wrapError);

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

  /**
   * @param {String} type
   * @param {{}} conditions
   * @returns {Promise}
   */
  this._delete = (type, conditions) => execute(client => client.query(sql.delete(type, conditions))
    .then(res => res.rowCount));

  const adjustAutoIncrements = (client, type, data, adjustAutoInc) => {
    //TODO Приведение счётчиков к данным
    return Promise.resolve();
  };

  const cleanNulls = (client, type, data) => {
    //TODO Притекло из монги: Обеспечение undefined вместо null-значений для полей, состоящих в уникальных разреженных индексах
    return Promise.resolve(data);
  };

  const filterByData  = (data) => {
    return {
      [Operations.AND]: Object.keys(data).map((attr) => {
        return {[Operations.EQUAL]: [`$${attr}`, data[attr]]};
      })
    };
  };

  /**
   * @param {String} type
   * @param {{}} data
   * @param {{}} [options]
   * @param {Boolean} [options.skipResult]
   * @param {Boolean} [options.adjustAutoInc]
   * @returns {Promise}
   */
  this._insert = (type, data, options) => {
    const {
      skipResult, adjustAutoInc
    } = options;
    return execute(client => cleanNulls(client, type, data)
      .then(cleanedData => client.query(sql.insert(type, cleanedData))
        .then(res => adjustAutoIncrements(client, type, cleanedData, adjustAutoInc)
          .then(() => {
            if (!skipResult) {
              const q = sql.select(type, {
                condition: filterByData(cleanedData),
                count: 1
              });
              return client.query(q)
                .then(result => processData(result.rows[0]));
            }
            return res.rowCount;
          }))));
  };

  /**
   * @param {String} type
   * @param {{}} conditions
   * @param {{}} data
   * @param {{}} [options]
   * @param {Boolean} [options.skipResult]
   * @param {Boolean} [options.bulk]
   * @param {Boolean} [options.adjustAutoInc]
   * @returns {Promise}
   */
  this._update = (type, conditions, data, options) => {
    const {
      skipResult, adjustAutoInc
    } = options;
    return execute(client => cleanNulls(client, type, data)
      .then(cleanedData => client.query(sql.update(type, cleanedData, conditions))
        .then(res => adjustAutoIncrements(client, type, cleanedData, adjustAutoInc)
          .then(() => {
            if (!skipResult) {
              const q = sql.select(type, {conditions: filterByData(cleanedData)});
              return client.query(q).then(result => processData(result.rows));
            }
            return res.rowCount;
          }))));
  };

  /**
   * @param {String} type
   * @param {{}} conditions
   * @param {{}} data
   * @param {{}} [options]
   * @param {Boolean} [options.skipResult]
   * @param {Boolean} [options.adjustAutoInc]
   * @returns {Promise}
   */
  this._upsert = (type, conditions, data, options) => {
    const {
      skipResult, adjustAutoInc
    } = options;
    let resConds = null;
    return execute(client => cleanNulls(client, type, data)
      .then(cleanedData => client.query(sql.select(type, {conditions}))
        .then((res) => {
          const q = res.rows[0] ?
            sql.update(type, cleanedData, filterByData(res.rows[0])) :
            sql.insert(type, cleanedData);
          resConds = res.rows[0] ? Object.assign({}, res.rows[0], cleanedData) : cleanedData;
          return client.query(q);
        })
        .then(res => adjustAutoIncrements(client, type, cleanedData, adjustAutoInc)
          .then(() => {
            if (!skipResult) {
              const q = sql.select(type, {
                conditions: filterByData(resConds),
                count: 1
              });
              return client.query(q).then(result => processData(result.rows[0]));
            }
            return res.rowCount;
          }))));
  };

  /**
   * @param {String} type
   * @param {{}} properties
   * @param {{unique: Boolean}} [options]
   * @returns {Promise}
   */
  this._ensureIndex = function (type, properties, options) {
    const name = 'index_' + cuid();
    const columns = Object.keys(properties).map(key => `${key} ${properties[key] < 0 ? 'DESC' : 'ASC'}`);
    return execute(client => client.query(sql.createIndex(name, type, columns, options.unique)))
      .then(() => name);
  };

  /**
   * @param {String} type
   * @param {{}} properties
   * @returns {Promise}
   */
  this._ensureAutoincrement = (type, properties) => execute((client) => {
      let pr = Promise.resolve();
      let names = {};
      Object.keys(properties).forEach((prop) => {
        const name = `sequence_${type}_${prop}`;
        const opts = properties[prop] || 1;
        const step = typeof opts === 'object' ? opts.step : opts;
        const start = typeof opts === 'object' && typeof opts.start === 'number' ?
          `START WITH ${opts.start}` :
          '';
        const query = `CREATE SEQUENCE ${name} INCREMENT BY ${step} ${start} OWNED BY ${type}.${prop};`;

        pr = pr.then(() => {
            config.queryLogging && log.log(JSON.stringify(query));
            return client.query(query);
          })
          .then(() => names[prop] = name);
      });
      return pr.then(() => names);
    });
}

PostgreSQL.prototype = new DataSource();

module.exports = PostgreSQL;
