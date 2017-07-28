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
  let exclusions = [];

  function db() {
    return options.dataSource.connection();
  }

  this.exclude = function (path) {
    exclusions.push(path);
  };

  this.init = function () {
    // Инициализируем сессии
    var sessOpts = clone(options.session || {});
    var MongoStore = dbc(session);
    sessOpts.store = new MongoStore({
      db: db(),
      ttl: 14 * 24 * 60 * 60
    });
    let smw = session(sessOpts);
    options.app.use(function (req, res, next) {
      for (let i = 0; i < exclusions.length; i++) {
        let tmp = exclusions[i];
        if (tmp[0] !== '/') {
          tmp = '/' + tmp;
        }
        tmp = '^' + tmp.replace(/\*\*/g, '.*').replace(/\\/g, '\\\\').replace(/\//g, '\\/') + '$';        
        if (req.path.test(new RegExp(tmp))) {
          return next();
        }
      }
      smw(req, res, next);
    });
  };
}

module.exports = SessionHandler;
