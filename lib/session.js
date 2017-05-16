/**
 * Created by kras on 19.07.16.
 */
'use strict';
const session = require('express-session');
const clone = require('clone');
const dbc = require('connect-mongo');

/**
 * @param {{}} options
 * @param {{}} options.session
 * @param {DataSource} options.dataSource
 * @param {{}} options.app
 * @constructor
 */
function SessionHandler(options) {
  function db() {
    return options.dataSource.connection();
  }
  this.init = function () {
    // Инициализируем сессии
    var sessOpts = clone(options.session || {});
    var MongoStore = dbc(session);
    sessOpts.store = new MongoStore({
      db: db(),
      ttl: 14 * 24 * 60 * 60
    });
    options.app.use(session(sessOpts));
  };
}

module.exports = SessionHandler;
