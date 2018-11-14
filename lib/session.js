/**
 * Created by kras on 19.07.16.
 */
/* eslint global-require:off */
'use strict';
const clone = require('clone');
const parseDuration = require('lib/duration');
const session = require('express-session');

/**
 * @param {{}} options
 * @param {{}} options.session
 * @param {{}} options.storage
 * @param {{}} options.app
 * @constructor
 */
function SessionHandler(options) {

  if (!options || !options.storage) {
    throw new Error('Не переданы настройки хранилища сессий');
  }

  const exclusions = [];

  this.exclude = path => exclusions.push(path);

  this.init = function () {
    // Инициализируем сессии
    var sessOpts = clone(options.session || {});
    if (sessOpts.cookie && sessOpts.cookie.maxAge) {
      if (typeof sessOpts.cookie.maxAge === 'string') {
        sessOpts.cookie.maxAge = parseDuration(sessOpts.cookie.maxAge, true);
      }
    }

    if (!options.storage) {
      throw new Error('Не указаны настройки хранилища сессий!');
    }

    let smw;
    let p = Promise.resolve();
    switch (options.storage.type) {
      case 'mongodb': {
        const dbc = require('connect-mongo');
        const MongoStore = dbc(session);
        p = p
          .then(() => options.storage.dataSource.open())
          .then((db) => {
            sessOpts.store = new MongoStore({db: db, ttl: 14 * 24 * 60 * 60});
            smw = session(sessOpts);
          });
      } break;
      case 'memcached': {
        const mc = require('connect-memcached');
        let MemcachedStore = mc(session);
        let opts = Object.assign({}, options.storage.options);
        opts.ttl = opts.ttl || 14 * 24 * 60 * 60;
        opts.hosts = opts.hosts || ['localhost:11211'];
        sessOpts = sessOpts || {};
        sessOpts.store = new MemcachedStore(opts);
        smw = session(sessOpts);
      } break;
      case 'redis':{
        const rc = require('connect-redis');
        let RedisStore = rc(session);
        let opts = Object.assign({}, options.storage.options);
        opts.ttl = opts.ttl || 14 * 24 * 60 * 60;
        opts.host = opts.host || 'localhost';
        opts.port = opts.port || '6379';
        sessOpts = sessOpts || {};
        sessOpts.store = new RedisStore();
        smw = session(sessOpts);
      } break;
      default: throw new Error('Указан неподдерживаемый тип хранилища сессий!');
    }

    return p.then(() => {
      if (options.app) {
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
          smw(req, res, next);
        });
      }
    });
  };
}

module.exports = SessionHandler;
