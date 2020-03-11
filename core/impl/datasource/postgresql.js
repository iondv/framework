const DataSource = require('core/interfaces/DataSource');
const { Client } = require('pg');
const LoggerProxy = require('core/impl/log/LoggerProxy');

function PostgreSQL(config) {

  const _this = this;
  const log = config.logger || new LoggerProxy();

  this.client = null;
  this.isOpen = false;
  this.busy = false;

  /**
   * @returns {*}
   */
  this._connection = function () {
    if (_this.client && _this.isOpen) {
      return _this.client;
    }
    return null;
  };

  /**
   * @returns {Promise}
   */
  this._open = function () {

    if (!_this.client) {
      _this.client = new Client({
        user?: string, // default process.env.PGUSER || process.env.USER
        password?: string, //default process.env.PGPASSWORD
        database?: string, // default process.env.PGDATABASE || process.env.USER
        port?: number, // default process.env.PGPORT
        connectionString?: string, // e.g. postgres://user:password@host:5432/database
        ssl?: any, // passed directly to node.TLSSocket
        types?: any, // custom type parsers
        statement_timeout?: number, // number of milliseconds before a statement in query will time out, default is no timeout
        query_timeout?: number, // number of milliseconds before a query call will timeout, default is no timeout
      });
      _this.client.on('end', () => {
        this.isOpen = false;
        this.busy = false;
      });
    }

    if (_this.isOpen && !_this.busy) {
      return Promise.resolve(true);
    } else if (!_this.isOpen && _this.busy) {
      return new Promise((resolve) => {
        _this.client.once('isOpen', () => {
          resolve(true);
        });
      });
    } else {
      _this.busy = true;
      return _this.client.connect()
        .then(() => {
          _this.isOpen = true;
          _this.busy = false;
          _this.client.emit('isOpen', _this.client);
          //TODO get baseName??
          log.info('Получено соединение с базой: ' + baseName);
          return true;
        });
    }
  };

  /**
   * @returns {Promise}
   */
  this._close = function () {
    if (_this.client && _this.isOpen) {
      return _this.client.end();
    }
    return Promise.resolve();
  };
}

PostgreSQL.prototype = new DataSource();

module.exports = PostgreSQL;
