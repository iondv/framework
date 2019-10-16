/**
 * Created by kras on 19.07.16.
 */
/* eslint global-require:off */
'use strict';
const clone = require('clone');
const parseDuration = require('lib/duration');
const session = require('express-session');
const FO = require('core/FunctionCodes');

const Store = session.Store;
const MemoryStore = session.MemoryStore;

class DsStore extends Store {

  constructor(ds, options) {
    options = options || {};

    /* Fallback */
    if (!ds || !ds.connection() && MemoryStore) {
      return new MemoryStore();
    }

    super(options);

    /* Options */
    /**
     * @var DataSource
     */
    this.dataSource = ds;
    this.ttl = options.ttl || 1209600; // 14 days
    this.autoRemoveInterval = options.autoRemoveInterval || 60;
    this.tableName = options.tableName || 'sessions';

    this.options = options;

    this.changeState('init');
    this.changeState('connecting');

    this.dataSource.ensureIndex(this.tableName, {sid: 1}, {unique: true})
      .then(() => {
        this.timer = setInterval(
          () => this.dataSource.delete(
            this.tableName,
            {
              [FO.LESS]: ['$expires', new Date()]
            }
          ),
          this.autoRemoveInterval * 1000 * 60);
        this.timer.unref();
        this.changeState('connected');
      });
  }

  changeState(newState) {
    if (newState !== this.state) {
      this.state = newState;
      this.emit(newState);
    }
  }

  /* Public API */

  get(sid, callback) {
    this.dataSource.get(
      this.tableName,
      {
        [FO.AND]: [
          {[FO.EQUAL]: ['$sid', sid]},
          {
            [FO.OR]: [
              {[FO.EMPTY]: ['$expires']},
              {[FO.GREATER]: ['$expires', new Date()]}
            ]
          }
        ]
      }
    ).then(
      (session) => {
        if (session) {
          if (typeof session.session === 'string') {
            session.session = JSON.parse(session.session);
          }
          const s = session.session;
          if (this.options.touchAfter > 0 && session.lastModified) {
            s.lastModified = session.lastModified;
          }
          this.emit('get', sid);
          return s;
        }
      }
    ).then(s => callback(null, s)).catch(callback);
  }

  set(sid, session, callback) {
    // Removing the lastModified prop from the session object before update
    if (this.options.touchAfter > 0 && session && session.lastModified) {
      delete session.lastModified;
    }

    let s;

    try {
      s = {sid: sid, session: session};
    } catch (err) {
      return callback(err);
    }

    if (session && session.cookie && session.cookie.expires) {
      s.expires = new Date(session.cookie.expires);
    } else {
      // If there's no expiration date specified, it is
      // browser-session cookie or there is no cookie at all,
      // as per the connect docs.
      //
      // So we set the expiration to two-weeks from now
      // - as is common practice in the industry (e.g Django) -
      // or the default specified in the options.
      s.expires = new Date(Date.now() + (this.ttl * 1000));
    }

    if (this.options.touchAfter > 0) {
      s.lastModified = new Date();
    }

    this.dataSource.upsert(this.tableName, {[FO.EQUAL]: ['$sid', sid]}, s, {skipResult: true})
      .then((result) => {
        this.emit(result ? 'update' : 'create', sid);
        this.emit('set', sid);
        callback();
      }).catch(callback);
  }

  touch(sid, session, callback) {
    const updateFields = {};
    const touchAfter = this.options.touchAfter * 1000;
    const lastModified = session.lastModified ? session.lastModified.getTime() : 0;
    const currentDate = new Date();

    // If the given options has a touchAfter property, check if the
    // current timestamp - lastModified timestamp is bigger than
    // the specified, if it's not, don't touch the session
    if (touchAfter > 0 && lastModified > 0) {
      const timeElapsed = currentDate.getTime() - session.lastModified;

      if (timeElapsed < touchAfter) {
        return callback();
      }
      updateFields.lastModified = currentDate;
    }

    if (session && session.cookie && session.cookie.expires) {
      updateFields.expires = new Date(session.cookie.expires);
    } else {
      updateFields.expires = new Date(Date.now() + (this.ttl * 1000));
    }

    this.dataSource.update(this.tableName, {[FO.EQUAL]: ['$sid', sid]}, updateFields, {skipResult: true})
      .then((result) => {
        if (result > 0) {
          this.emit('touch', sid, session);
        }
        callback(null);
      })
      .catch(callback);
  }

  destroy(sid, callback) {
    this.dataSource.delete(this.tableName, {[FO.EQUAL]: ['$sid', sid]})
      .then(() => this.emit('destroy', sid))
      .then(() => callback(null))
      .catch(callback);
  }

  length(callback) {
    return this.dataSource.count(this.tableName).then(n => callback(null, n)).catch(callback);
  }

  clear(callback) {
    return this.dataSource.delete(this.tableName)
      .then(() => this.emit('clear'))
      .then(() => callback(null))
      .catch(callback);
  }

  close() {
    this.emit('close');
  }
}



/**
 * @param {{}} options
 * @param {{}} options.session
 * @param {{}} options.storage
 * @param {{}} options.app
 * @constructor
 */
function SessionHandler(options) {

  if (!options || !options.storage) {
    throw new Error('Session storage settings not passed');
  }

  const exclusions = [];

  this.exclude = path => exclusions.push(path);

  this.init = function () {
    // Initialize the sessions
    var sessOpts = clone(options.session || {});
    if (sessOpts.cookie && sessOpts.cookie.maxAge) {
      if (typeof sessOpts.cookie.maxAge === 'string') {
        sessOpts.cookie.maxAge = parseDuration(sessOpts.cookie.maxAge, true);
      }
    }

    if (!options.storage) {
      throw new Error('No session storage settings specified!');
    }

    let smw;
    let p = Promise.resolve();
    switch (options.storage.type) {
      case 'mongodb':
      case 'db':
        p = p
          .then(() => options.storage.dataSource.open())
          .then(() => {
            let opts = Object.assign({}, options.storage.options);
            opts.ttl = opts.ttl || 14 * 24 * 60 * 60;
            sessOpts.store = new DsStore(options.storage.dataSource, opts);
            smw = session(sessOpts);
          });
        break;
      case 'memcached':
      {
        const mc = require('connect-memcached');
        let MemcachedStore = mc(session);
        let opts = Object.assign({}, options.storage.options);
        opts.ttl = opts.ttl || 14 * 24 * 60 * 60;
        opts.hosts = opts.hosts || ['localhost:11211'];
        sessOpts = sessOpts || {};
        sessOpts.store = new MemcachedStore(opts);
        smw = session(sessOpts);
      }
        break;
      case 'redis':
      {
        const rc = require('connect-redis');
        let RedisStore = rc(session);
        let opts = Object.assign({}, options.storage.options);
        opts.ttl = opts.ttl || 14 * 24 * 60 * 60;
        opts.host = opts.host || 'localhost';
        opts.port = opts.port || '6379';
        sessOpts = sessOpts || {};
        sessOpts.store = new RedisStore();
        smw = session(sessOpts);
      }
        break;
      default: throw new Error('The specified type of session storage is not supported!');
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
