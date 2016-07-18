/**
 * Created by kras on 19.07.16.
 */
'use strict';
var session = require('express-session');
var clone = require('clone');
/**
 * @param {{}} options
 * @param {{}} options.session
 * @param {DataSource} options.dataSource
 * @param {{}} options.app
 * @constructor
 */
function SessionHandler(options) {
  this.init = function () {
    // Инициализируем сессии
    var sessOpts = clone(options.session || {});
    var MongoStore = require('connect-mongo')(session);
    sessOpts.store = new MongoStore({
      db: options.dataSource.connection(),
      ttl: 14 * 24 * 60 * 60
    });
    options.app.use(session(sessOpts));
  };
}

module.exports = SessionHandler;
