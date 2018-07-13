/**
 * Created by kras on 19.07.16.
 */
'use strict';
const session = require('express-session');
const clone = require('clone');
const dbc = require('connect-mongo');
const parseDuration = require('lib/duration');

/**
 * @param {{}} options
 * @param {{}} options.session
 * @param {DataSource} options.dataSource
 * @param {{}} options.app
 * @constructor
 */
function SessionHandler(options) {
  var exclusions = [];

  var smw = null;

  var _db = null;

  var connecting = false;

  function getSMW(sessOpts) {
    let db = options.dataSource.connection();
    if (db && db === _db && smw) {
      return Promise.resolve(smw);
    }
    if (connecting) {
      return Promise.reject(new Error('Не удалось инициализировать хранилище сессий.'));
    }
    smw = null;
    connecting = true;
    return options.dataSource.open().then((db) => {
      _db = db;
      connecting = false;
      var MongoStore = dbc(session);
      sessOpts.store = new MongoStore({db: db, ttl: 14 * 24 * 60 * 60});
      smw = session(sessOpts);
      return smw;
    }).catch((err) => {
      options.log ? options.log.error(err) : console.error(err);
      connecting = false;
    });
  }

  this.exclude = function (path) {
    exclusions.push(path);
  };

  this.init = function () {
    // Инициализируем сессии
    var sessOpts = clone(options.session || {});
    if (sessOpts.cookie && sessOpts.cookie.maxAge) {
      if (typeof sessOpts.cookie.maxAge === 'string') {
        sessOpts.cookie.maxAge = parseDuration(sessOpts.cookie.maxAge, true);
      }
    }
    options.app.use((req, res, next) => {
      for (let i = 0; i < exclusions.length; i++) {
        let tmp = exclusions[i];
        if (tmp[0] !== '/') {
          tmp = '/' + tmp;
        }
        tmp = '^' + tmp.replace(/\*\*/g, '.*').replace(/\\/g, '\\\\').replace(/\//g, '\\/') + '$';
        if (new RegExp(tmp).test(req.path)) {
          return next();
        }
      }
      getSMW(sessOpts)
        .then(smw => smw(req, res, next))
        .catch((err) => {
          options.log ? options.log.error(err) : console.error(err);
          res.sendStatus(500);
        });
    });
  };
}

module.exports = SessionHandler;
