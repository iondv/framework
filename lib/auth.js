/**
 * Created by kras on 20.02.16.
 */
'use strict';

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const clone = require('clone');
const merge = require('merge');
const LoggerProxy = require('core/impl/log/LoggerProxy');
const EventEmitter = require('events');
const util = require('util');
const moment = require('moment');
const Permissions = require('core/Permissions');
const locale = require('locale');
const User = require('core/User');
const F = require('core/FunctionCodes');
const cookieParser = require('cookie-parser');
const lastVisit = require('lib/last-visit');
const parseDuration = require('lib/duration');
const StrategyProvider = require('lib/interfaces/StrategyProvider');
const pwdHasher = require('password-hash-and-salt');
const strings = require('core/strings');
const IonError = require('core/IonError');
const Errors = require('core/errors/auth');
const url = require('url');

const failsRegistry = 'ion_auth_fails';
const authLog = 'ion_auth_log';
const signInResource = 'sys:::sign-in';
const urlResource = 'sys:::url';

const ANON = 'anonymous';
const EXCL_EXTENSIONS = ['aac', 'abw', 'arc', 'avi', 'azw', 'bin', 'bz', 'bz2', 'csh', 'css', 'csv', 'doc', 'eot',
  'epub', 'gif', 'ico', 'ics', 'jar', 'jpeg', 'jpg', 'js', 'json', 'mid', 'midi', 'mpeg', 'mpkg', 'odp', 'ods',
  'odt', 'oga', 'ogv', 'ogx', 'otf', 'png', 'pdf', 'ppt', 'rar', 'rtf', 'svg', 'swf', 'tar', 'tif', 'tiff', 'ts',
  'ttf', 'vsd', 'wav', 'weba', 'webm', 'webp', 'woff', 'woff2', 'xls', 'xml', 'xul', 'zip', '3gp', '3g2', '7z'];

// jshint maxstatements: 80, maxcomplexity: 30

/**
 *
 * @return {Boolean}
 */
function isBefore({value=5, unit='m'}, time2) {
  const time1 = moment().subtract(value, unit);
  if (time2) {
    return moment(time1).isBefore(time2);
  }
  return false;
}

function Anonymous(coactors) {
  User.apply(this, [{id: ANON}, coactors]);
}

/**
 * @param {{dataSource: DataSource}} options
 * @param {AccountStorage} options.accounts
 * @param {{}} options.app
 * @param {AclProvider} [options.acl]
 * @param {Object[]} [options.passports]
 * @param {Boolean} [options.denyTopLevel]
 * @param {Boolean} [options.publicRegistration]
 * @param {String[]} [options.exclude]
 * @param {Integer} [options.inactiveTimeout]
 * @param {Integer} [options.passwordLifetime]
 * @param {Integer} [options.passwordMinLength]
 * @param {Integer} [options.passwordMinPeriod]
 * @param {Integer} [options.passwordJournalSize]
 * @param {Integer} [options.attemptTimeOut]
 * @param {Integer} [options.attemptLimit]
 * @param {Integer} [options.tempBlockPeriod]
 * @param {Integer} [options.tempBlockLimit]
 * @param {Integer} [options.tempBlockInterval]
 * @param {Integer} [options.blockPeriod]
 * @param {Boolean} [options.checkSignInAccess]
 * @param {Boolean} [options.checkUrlAccess]
 * @param {Boolean} [options.restoreLastRequest]
 * @param {String} [options.changePwdUrl]
 * @param {{}} [options.passwordComplexity]
 * @param {EventLogger} options.eventLogger
 */
function Auth(options) {
  const _this = this;

  const eventLoggerTypes = options.eventLogger.types();
  const exclude = options.exclude || [];
  const inactiveTimeout = parseDuration(options.inactiveTimeout || '15m');
  const passwordLifetime = parseDuration(options.passwordLifetime || '100y');
  const passwordMinPeriod = parseDuration(options.passwordMinPeriod || '0h');
  const passwordMinLength = options.passwordMinLength || 0;
  const attemptTimeOut = parseDuration(options.attemptTimeOut || '24h');
  const attemptLimit = options.attemptLimit || 0;
  const tempBlockTimeOut = parseDuration(options.tempBlockPeriod || '15m');
  const tempBlockLimit = options.tempBlockLimit || 3;
  const tempBlocksPeriod = parseDuration(options.tempBlockInterval || '24h');
  const fullBlockTimeOut = parseDuration(options.blockPeriod || '120d');
  const passwordComplexity = options.passwordComplexity ?
    options.passwordComplexity :
  {upperLower: true, number: true, special: true};
  const passwordJournalSize = options.passwordJournalSize || 5;
  const changePwdUrl = options.changePwdUrl;

  if (options.restoreLastRequest === false) {
    lastVisit.disable();
  } else {
    lastVisit.enable();
  }

  /**
   * @type {DataSource}
   */
  const ds = options.dataSource;

  const app = options.app;

  const log = options.logger || new LoggerProxy();

  const __ = (str, params) => strings.s('errors', str, params);

  let anon;

  if (!ds) {
    throw new IonError(Errors.NO_DS);
  }

  this.authOptions = function () {
    return {
      passwordMinLength,
      passwordComplexity
    };
  };

  this.exclude = function (expr) {
    exclude.push(expr);
  };

  /**
   * Метод получения учетной записи текущего пользователя
   * @param {String} id
   * @param {Function} callback
   */
  this.userProfile = function (id, callback) {
    let u, ca = {};

    options.accounts.get(id)
      .then(
        (a) => {
          u = a;
          return (u && options.acl) ? options.acl.getCoactors(u.id()) : [];
        }
      )
      .then(
        (coactors) => {
          if (u) {
            coactors.forEach((a) => {
              ca[a] = true;
            });
            u.setCoactors(ca);
          }
          return u;
        }
      )
      .then(callback)
      .catch((err) => {
        log.error(err);
        callback(null);
      });
  };

  this.register = (user, callback) => options.accounts.register(user).then(u => callback(null, u)).catch(callback);

  function regAuthFail(username, fail) {
    let now = new Date();
    if (!fail) {
      let data = {
        username,
        attempts: 1,
        lastAttempt: now
      };
      return ds.insert(failsRegistry, data);
    } else {
      if (fail.blockedTill) {
        return Promise.resolve(fail);
      }
      let update = {lastAttempt: now};
      if (fail.lastAttempt && isBefore(attemptTimeOut, fail.lastAttempt)) {
        update.attempts = fail.attempts ? fail.attempts + 1 : 1;
      } else {
        update.attempts = 1;
      }
      if (update.attempts >= attemptLimit && attemptLimit) {
        update.attempts = null;
        update.lastAttempt = null;
        if (fail.firstTmpBlock && isBefore(tempBlocksPeriod, fail.firstTmpBlock)) {
          update.tmpBlocks = fail.tmpBlocks ? fail.tmpBlocks + 1 : 1;
        } else {
          update.tmpBlocks = 1;
        }
        if (update.tmpBlocks === 1) {
          update.firstTmpBlock = now;
        }
        update.blockedTill = moment().add(tempBlockTimeOut.value, tempBlockTimeOut.unit).toDate();
      }
      if (update.tmpBlocks >= tempBlockLimit) {
        update.attempts = null;
        update.lastAttempt = null;
        update.tmpBlocks = null;
        update.firstTmpBlock = null;
        update.blockedTill = moment().add(fullBlockTimeOut.value, fullBlockTimeOut.unit).toDate();
      }
      return ds.update(failsRegistry, {[F.EQUAL]: ['$username', username]}, update);
    }
  }

  function aclChecker(user, module) {
    if (options.acl && options.checkSignInAccess) {
      return options.acl
        .checkAccess(user, signInResource + (module ? ':' + module : ''), Permissions.USE)
        .then((can) => {
          if (!can) {
            const err = new IonError(Errors.FORBID);
            err.failInfo = true;
            throw err;
          }
          return user;
        });
    }
    return Promise.resolve(user);
  }

  function logAuthEvent(username, type, message) {
    return ds.insert(authLog,
      {
        time: new Date(),
        user: username,
        event: type,
        info: message
      },
      {skipResult: true}
    ).catch(err => log.error(err));
  }

  function onAuthFail(username, err, cb) {
    return function () {
      cb(err);
      logAuthEvent(username, 'fail', err && (err.message || err));
    };
  }

  function throwBlocked(fail, req) {
    let d = moment(fail.blockedTill);
    let locales = new locale.Locales(req.headers['accept-language']);
    d.locale(locales[0] ? locales[0].language : 'ru');
    const err = new IonError(Errors.TMP_BLOCK, {d: d.format('L LT')});
    err.failInfo = fail;
    return err;
  }

  function signInMin(username, password, type) {
    if (username.indexOf('@') < 0 && type) {
      username = username + '@' + type;
    }
    return options.accounts.get(username, password);
  }

  this.signIn = function (username, password, type) {
    return signInMin(username, password, type);
  };

  function signIn(req, username, password, done) {
    ds.get(failsRegistry, {[F.EQUAL]: ['$username', username]})
      .then((fail) => {
        if (fail && fail.blockedTill) {
          if (moment().isBefore(fail.blockedTill)) {
            return Promise.reject(throwBlocked(fail, req));
          } else {
            return ds.update(failsRegistry, {[F.EQUAL]: ['$username', username]}, {blockedTill: null});
          }
        }
        return fail;
      })
      .then(
        fail => signInMin(username, password)
          .then((user) => {
            if (!user) {
              throw new IonError(Errors.FAIL);
            }
            if (passwordMinLength && !password) {
              throw new IonError(Errors.LACK_PWD);
            }
            user.setProperties({ip: req.ip});
            return user;
          })
          .catch((error) => {
            error.failInfo = fail || null;
            throw error;
          })
      )
      .then(user =>
        ds.delete(failsRegistry, {[F.EQUAL]: ['$username', username]})
          .then(() => aclChecker(user, req.module))
      )
      .then((user) => {
        done(null, user);
        logAuthEvent(user.login(), 'sign in');
      })
      .catch((err) => {
        let prom = Promise.resolve();
        if (typeof err.failInfo !== 'undefined') {
          prom = regAuthFail(username, err.failInfo)
            .then((fail) => {
              if (fail.blockedTill) {
                err = throwBlocked(fail, req);
              }
              onAuthFail(username, err, done)();
            });
        } else {
          prom = prom.then(onAuthFail(username, err, done));
        }
        prom.then(() => options.eventLogger.logChange(eventLoggerTypes.FAILURE,
          {name: username, ip: req.ip, message: err && (err.message || err)}))
        .catch(error => log.error(error));
      });
  }

  function _exit(req, res, exit) {
    if (req.isAuthenticated() && req.user) {
      _this.emit('logout', req.user, req);
      logAuthEvent(req.user.login(), 'sign out');
      options.eventLogger.logChange(eventLoggerTypes.LOGOUT,
        {id: req.user.id(), name: req.user.name(), ip: req.user.properties().ip})
      .catch(err => log.error(err));
      req.logout();
    }
    delete req.session.coactors;
    delete req.session.authEntryPoint;
    const logoutRedirect = req.session.logoutRedirect;
    delete req.session.logoutRedirect;
    res.redirect(logoutRedirect || exit || '/auth');
  }

  function _changePwd(req, res, redirect) {
    res.redirect(redirect || '/chpwd');
  }

  function signOut(exit) {
    return function (req, res) {
      _exit(req, res, exit || '/auth');
    };
  }

  function renderAuthForm(req, res, module) {
    res.status(401).render('login', {
      baseUrl: req.app.locals.baseUrl,
      module: module,
      canRegister: options.publicRegistration,
      goHome: options.goHome,
      errors: req.session && req.flash('error') || [__(Errors.UNAVAILABLE)]
    });
  }

  this.profileFields = function () {
    return options.accounts.profileFields();
  };

  function validate(data) {
    return options.accounts.validate(data.properties)
      .then((properties) => {
        let language;
        const langs = app.locals.supportedLanguages;
        if (data.language && langs.includes(data.language)) {
          language = data.language;
        }
        return {language, properties};
      });
  }

  function renderRegisterForm(req, res, module) {
    if (!options.publicRegistration) {
      res.sendStatus(404);
    } else {
      options.accounts.profileFields()
        .then((fields) => {
          res.status(200).render('register', {
            fields,
            baseUrl: req.app.locals.baseUrl,
            module: module,
            options: {
              pwdMinLength: passwordMinLength
            },
            errors: req.flash('error')
          });
        })
        .catch(() => res.sendStatus(404));
    }
  }

  function renderProfileForm(req, res, module) {
    const user = _this.getUser(req);
    options.accounts.profileFields()
      .then((fields) => {
        res.status(200).render('profile', {
          user,
          languages: req.app.locals.supportedLanguages,
          fields,
          baseUrl: req.app.locals.baseUrl,
          module: module,
          options: {
            pwdMinLength: passwordMinLength
          },
          errors: req.flash('error')
        });
      })
      .catch(() => res.sendStatus(404));
  }

  function authFormHandler(onAuthenticated, module) {
    return function (req, res) {
      if (req.isAuthenticated()) {
        res.redirect(req.session.authEntryPoint ? req.session.authEntryPoint : onAuthenticated || '/');
        return;
      }
      renderAuthForm(req, res, module);
    };
  }

  function registerFormHandler(module) {
    return function (req, res) {
      return Promise.resolve().then(() => {
        if (req.isAuthenticated()) {
          return options.eventLogger.logChange(eventLoggerTypes.LOGOUT,
            {id: req.user.id(), name: req.user.name(), ip: req.ip})
          .then(() => {
            delete req.session.authEntryPoint;
            req.logout();
          });
        }
        return null;
      })
      .then(() => renderRegisterForm(req, res, module));
    };
  }

  function profileFormHandler(module, redirect) {
    return function (req, res) {
      if (req.isAuthenticated()) {
        return renderProfileForm(req, res, module);
      }
      return res.redirect(redirect || app.locals.baseUrl + module + 'auth');
    };
  }

  function signInHandler(self, success, module) {
    return function (req, res, next) {
      req.module = module;
      if (!req.body.username) {
        return res.redirect(self);
      }
      if (!req.body.password) {
        if (passwordMinLength) {
          req.flash('error', __(Errors.NO_PWD));
          return res.redirect(self);
        } else {
          req.body.password = '';
        }
      }
      if (req.body.timezone) {
        req.session.clientTimeZone = req.body.timezone;
      }
      passport.authenticate('local',
        function (err, user) {
          if (err) {
            if (typeof err.failInfo === 'undefined') {
              log.error(err);
              req.flash('error', __(Errors.INTERNAL_ERR));
            } else {
              req.flash('error', typeof err === 'string' ? err : err.message);
            }
            res.redirect(self);
          } else if (user) {
            req.logIn(user, (err) => {
              if (err) {
                return next(err);
              }
              user.setProperties({ip: req.ip});
              req.session.lastActive = new Date();
              _this.emit('login', req.body.username, req.body.password, user);

              let redir = req.session.authEntryPoint;
              if (redir && redir.endsWith('/')) {
                redir = redir.substr(0, redir.length - 1);
              }
              if (!redir || redir === app.locals.baseUrl + app.locals.defaultModule) {
                let last = lastVisit.get(req);
                if (last) {
                  redir = last;
                }
              }
              if (!redir) {
                redir = app.locals.baseUrl + app.locals.defaultModule;
              }
              delete req.session.authEntryPoint;
              if (user.needPwdReset()) {
                redir = app.locals.baseUrl + (changePwdUrl || 'chpwd');
              }
              return options.eventLogger.logChange(eventLoggerTypes.LOGIN, {id: user.id(), name: user.name(), ip: user.properties().ip})
                .then(() => options.acl ? options.acl.getCoactors(user.id()) : [])
                .then((coactors) => {
                  req.session.coactors = {};
                  coactors.forEach((a) => {
                    req.session.coactors[a] = true;
                  });
                  let data = user.properties();
                  if (data) {
                    for (let nm in data) {
                      if (data.hasOwnProperty(nm)) {
                        req.session[nm] = data[nm];
                      }
                    }
                  }
                  res.redirect(redir);
                })
                .catch((e) => {
                  log.error(e);
                  res.redirect(redir);
                });
            });
          } else {
            req.flash('error', __(Errors.FAIL));
            res.redirect(self);
          }
        })(req, res, next);
    };
  }

  function validatePasswordComplexity(pwd, complexity) {
    const parts = {
      upperLower: '(?=.*[a-zа-я])(?=.*[A-ZА-Я])',
      number: '(?=.*[0-9])',
      special: '(?=.*[^0-9a-zа-яA-ZА-Я])'
    };
    let reg = '^';
    for (const nm in complexity) {
      if (complexity.hasOwnProperty(nm) && parts.hasOwnProperty(nm) && complexity[nm]) {
        reg += parts[nm];
      }
    }
    reg += '.*$';
    reg = new RegExp(reg);
    return reg.test(pwd);
  }

  function validatePassword(body, cb, uid) {
    if (!body.password) {
      return cb(__(Errors.NO_PWD), false);
    }

    if (body.password !== body.password2) {
      return cb(__(Errors.BAD_PWD_REPEAT), false);
    }

    if (body.password.length < passwordMinLength) {
      return cb(__(Errors.MIN_PWD_LENGTH, {p: passwordMinLength}), false);
    }

    if (passwordComplexity && !validatePasswordComplexity(body.password, passwordComplexity)) {
      const opts = [];
      if (passwordComplexity.upperLower) {
        opts.push(__(Errors.UPPER_LOWER));
      }
      if (passwordComplexity.number) {
        opts.push(__(Errors.NUMBERS));
      }
      if (passwordComplexity.special) {
        opts.push(__(Errors.SPECIAL));
      }
      const msg = __(Errors.WEAK_PWD) + opts.join(opts.length < 3 ? __(Errors.AND) : ',') + '.';
      return cb(msg, false);
    }

    if (uid) {
      let hasher = pwdHasher(body.password);
      ds.fetch('ion_pwd_log', {filter: {[F.EQUAL]: ['$user', uid]}})
        .then((pwds) => {
          let p = Promise.resolve();
          let pwds2 = pwds.slice(0, passwordJournalSize - 1);
          pwds2.forEach((pwd) => {
            p = p.then(() => new Promise((resolve, reject) => {
              hasher.verifyAgainst(pwd.hash, (err, verified) => {
                if (err) {
                  reject(err);
                  return;
                }
                if (verified) {
                  reject(__(Errors.PRIOR_PWD, {p: passwordJournalSize}));
                  return;
                }
                resolve();
              });
            }));
          });
          return p;
        })
        .then(() => cb(null, true))
        .catch(cb);
      return;
    }

    return cb(null, true);
  }

  this.validatePassword = function (password, password2, uid) {
    return new Promise(
      (res, rej) => validatePassword(
        {password, password2},
        (err, result) => err ? rej(err) : res(result),
        uid
      ));
  };

  function logPassword(uid, pwdHash) {
    return ds.fetch('ion_pwd_log', {filter: {[F.EQUAL]: ['$user', uid]}, sort: {'date': 1}})
      .then((pwds) => {
        if (pwds.length > passwordJournalSize) {
          let res = Promise.resolve();
          let forDel = pwds.slice(0, pwds.length - passwordJournalSize);
          forDel.forEach((rec) => {
            res = res.then(
              () => ds.delete(
                'ion_pwd_log',
                {[F.AND]: [{[F.EQUAL]: ['$user', uid]}, {[F.EQUAL]: ['$date', rec.date]}]}
              )
            );
          });
          return res;
        }
      })
      .then(() => ds.insert('ion_pwd_log', {user: uid, hash: pwdHash, date: new Date()}, {skipResult: true}));
  }

  this.logPassword = function (uid, pwdHash, author) {
    const logRecord = {
      id: author.id(),
      name: author.name(),
      ip: author.properties().ip,
      subject: uid
    };
    return logPassword(uid, pwdHash)
      .then(() => options.eventLogger.logChange(eventLoggerTypes.CHANGE_PASSWORD, logRecord));
  };

  function registerHandler(self, success, module) {
    return function (req, res, next) {
      if (!options.publicRegistration) {
        req.flash('error', __(Errors.REG_BAN));
        return res.redirect(self);
      }

      validatePassword(req.body, (err) => {
        if (err) {
          req.flash('error', err);
          return res.redirect(self);
        }

        const locales = new locale.Locales(req.headers['accept-language']);
        const langs = app.locals.supportedLanguages;
        const language = (locales[0] && langs.includes(locales[0].language))
          ? locales[0].language
          : 'ru';

        let user = {
          name: req.body.username,
          pwd: req.body.password,
          language
        };

        validate(req.body)
          .then(({properties}) => {
            user.properties = properties || {};
            return user;
          })
          .then(user => _this.register(user, function (err, u) {
            if (err) {
              log.error(err);
              req.flash('error', 'Не удалось зарегистрировать пользователя!');
              return res.redirect(self);
            }
            return options.eventLogger.logChange(eventLoggerTypes.REGISTER, {id: u.id(), name: u.name(), ip: u.properties().ip})
              .then(() => logPassword(u.id(), u.pwdHash()))
              .then(() => {
                signInHandler(self, success, module)(req, res, next);
              })
              .catch((err) => {
                log.error(err);
                signInHandler(self, success, module)(req, res, next);
              });
          }))
          .catch((err) => {
            log.error(err);
            req.flash('error', __(Errors.REG_FAIL));
            return res.redirect(self);
          });
      });
    };
  }

  function profileHandler(self, success, module) {
    return function (req, res, next) {
      if (!req.isAuthenticated()) {
        req.session.authEntryPoint = null;
        return res.redirect((module ? '/' + module : '') + '/auth');
      }
      validate(req.body)
        .then(output => options.eventLogger.logChange(eventLoggerTypes.EDIT_PROFILE,
            {id: req.user.id(), name: req.user.name(), ip: req.user.properties().ip, before: req.user.properties(), updates: output})
          .then(() => options.accounts.set(req.user.id(), output)))
        .then((user) => {
          user.setProperties({ip: req.ip});
          req.logIn(user, function (err) {
            if (err) {
              return next(err);
            }
            let data = user.properties();
            if (data) {
              for (let nm in data) {
                if (data.hasOwnProperty(nm)) {
                  req.session[nm] = data[nm];
                }
              }
            }
            _this.emit('edit-profile', user);
            return res.redirect(self || '/profile');
          });
        })
        .catch((err) => {
          log.error(err);
          req.flash('error', __(Errors.EDIT_USER_FAIL));
          return res.redirect(self || '/profile');
        });
    };
  }

  function active(lastActive) {
    return isBefore(inactiveTimeout, lastActive);
  }

  function livePassword(user) {
    if (user.type() === 'local') {
      return isBefore(passwordLifetime, user.pwdDate());
    }
    return true;
  }

  function pthRes(path) {
    if (path && path[0] === '/') {
      path = path.substr(1);
    }
    if (path && path[path.length - 1] === '/') {
      path = path.substr(0, path.length - 1);
    }
    return urlResource + ':' + path;
  }

  function checkPathAccess(user, path) {
    let pth = pthRes(path);
    return options.acl.getPermissions(user, [pth, pth + '/*'])
      .then((perms) => {
        perms = merge(true, perms[pth], perms[pth + '/*']);
        return perms[Permissions.USE] || perms[Permissions.FULL];
      })
      .then((can) => {
        if (path.substr(-2) === '/*') {
          path = path.substr(0, path.length - 2);
        }
        if (!can && path.lastIndexOf('/') > 0) {
          return checkPathAccess(user, path.substring(0, path.lastIndexOf('/')) + '/*');
        }
        return can;
      });
  }

  /**
   * @param {String} url
   */
  function isNotStatic(url) {
    let ext = url.substr(url.lastIndexOf('.') + 1);
    return EXCL_EXTENSIONS.indexOf(ext) < 0;
  }

  function verifier(redirect, module, chpwd) {
    return function (req, res, next) {
      let pth = (module ? '/' + module : '') + req.path;
      if (Array.isArray(exclude)) {
        for (let i = 0; i < exclude.length; i++) {
          if (exclude[i]) {
            let tmp = exclude[i];
            try {
              if (tmp[0] !== '^') {
                tmp = '^' + tmp;
              }
              if (tmp[tmp.length - 1] !== '$') {
                tmp = tmp + '$';
              }
              let reg = new RegExp(tmp);
              if (reg.test(pth)) {
                return next();
              }
            } catch (e) {
              tmp = exclude[i];
            }

            try {
              if (tmp[0] !== '/') {
                tmp = '/' + tmp;
              }
              tmp = '^' + tmp.replace(/\*\*/g, '.*').replace(/\\/g, '\\\\').replace(/\//g, '\\/') + '$';
              let reg = new RegExp(tmp);
              if (reg.test(pth)) {
                return next();
              }
            } catch (e) {
              continue;
            }
          }
        }
      }
      if (!req.isAuthenticated()) {
        if (isNotStatic(req.originalUrl) && !req.xhr && req.session && !req.session.authEntryPoint) {
          req.session.authEntryPoint = req.originalUrl;
        }
        return res.redirect(redirect || (module ? '/' + module : '') + '/auth');
      } else if (!livePassword(req.user)) {
        chpwd = chpwd || 'chpwd';
        if (req.path === '/' + chpwd) {
          return next();
        }
        return _changePwd(req, res, (module ? '/' + module : '') + '/' + chpwd);
      } else if (!active(req.session.lastActive)) {
        return _exit(req, res, redirect || (module ? '/' + module : '') + '/auth');
      }

      let path = req.path;
      if (module) {
        path = module + path;
      }

      let user = _this.getUser(req);
      user.setProperties({ip: req.ip});

      if (options.acl && (
          options.checkUrlAccess === true ||
          (
            Array.isArray(options.checkUrlAccess) &&
            pathForCheck(options.checkUrlAccess, path)
          )
        ) &&
        req.path && path !== '/'
      ) {
        checkPathAccess(user, path)
          .then((can) => {
            if (!can) {
              return redirectForbidden(path, res);
            }
            req.session.lastActive = new Date();
            _this.emit('verify', user, function () {
              _exit(req, res, redirect || (module ? '/' + module : '') + '/auth');
            });
            next();
          })
          .catch((err) => {
            log.error(err);
            res.sendStatus(500);
          });
        return;
      }

      req.session.lastActive = new Date();
      _this.emit('verify', req.user, function () {
        _exit(req, res, redirect || (module ? '/' + module : '') + '/auth');
      });
      next();
    };
  }

  function redirectForbidden(path, res) {
    let target = options.forbiddenRedirect;
    if (typeof target === 'string') {
      return res.redirect(target);
    }
    if (target) {
      for (let key of Object.keys(target)) {
        try {
          if (new RegExp(key).test(path)) {
            return res.redirect(target[key]);
          }
        } catch (err) {
          log.error(err);
        }
      }
    }
    res.status(403).render('403');
  }

  function renderChangePwdForm(req, res, module) {
    res.status(200).render('changePwd', {
      user: _this.getUser(req),
      baseUrl: req.app.locals.baseUrl,
      module: module,
      options: {
        pwdMinLength: passwordMinLength
      },
      errors: req.flash('error')
    });
  }

  function changePwdFormHandler(module) {
    return function (req, res) {
      if (req.isAuthenticated()) {
        renderChangePwdForm(req, res, module);
      } else {
        res.sendStatus(403);
      }
    };
  }

  function changePwdHandler(self, module) {
    return function (req, res) {
      if (req.isAuthenticated()) {
        if (!req.user.needPwdReset() && isBefore(passwordMinPeriod, req.user.pwdDate())) {
          req.flash('error', __(Errors.PWD_BAN_NOT_FINISHED));
          return res.redirect(self);
        }
        validatePassword(
          req.body,
          (err) => {
            if (err) {
              req.flash('error', err);
              return res.redirect(self);
            }

            options.accounts
              .setPassword(req.user.id(), req.user.pwdHash(), req.body.password)
              .then(hash => logPassword(req.user.id(), hash))
              .then(() => options.eventLogger.logChange(eventLoggerTypes.CHANGE_PASSWORD,
                {id: req.user.id(), name: req.user.name(), ip: req.user.properties().ip}))
              .then(() => _exit(req, res, (module ? '/' + module : '') + '/auth'))
              .catch((err) => {
                req.flash('error', err.message);
                return res.redirect(self);
              });
          },
          req.user.id()
        );
      } else {
        res.sendStatus(403);
      }
    };
  }

  function checkPwdHandler() {
    return function (req, res) {
      validatePassword(
        req.body,
        (err) => {
          if (err) {
            if (typeof err == 'string') {
              res.send({result: false, error: err});
              return;
            }
            log.error(err);
            res.setStatus(500).send(__(Errors.INTERNAL_ERR));
            return;
          }
          res.send({result: true});
        },
        req.isAuthenticated() ? req.user.id() : null
      );
    };
  }

  this.bindAuth = function (a, module, routes) {
    let prefix = url.parse(app.locals.baseUrl).pathname;
    let {auth, register, success, chpwd, profile, checkPwd} = routes || {};
    auth = auth !== false ? auth || 'auth' : auth;
    register = register !== false ? register || 'register' : register;
    if (!checkPwd) {
      if (register || chpwd) {
        checkPwd = 'checkPwd';
      }
    }
    success = success || prefix + module;
    if (options.denyTopLevel) {
      if (auth) {
        a.get(prefix + module + '/' + auth, authFormHandler(success, module));
        a.get(prefix + module + '/sign-out', signOut(prefix + module + '/' + auth));
      } else {
        a.get(prefix + module + '/sign-out', signOut('/'));
      }
      if (register) {
        a.get(prefix + module + '/' + register, registerFormHandler(module));
        a.post(prefix + module + '/' + register, cookieParser(), registerHandler(prefix + module + '/' + register, success, module));
      }
      if (auth) {
        a.post(prefix + module + '/' + auth, cookieParser(), signInHandler(prefix + module + '/' + auth, success, module));
      }

      if (checkPwd) {
        a.post(prefix + module + '/' + checkPwd, checkPwdHandler());
      }

      if (auth) {
        a.use(prefix + module, verifier(prefix + module + '/' + auth, module, chpwd));
      }

      if (chpwd) {
        a.get(prefix + module + '/' + chpwd, changePwdFormHandler(module));
        a.post(prefix + module + '/' + chpwd, changePwdHandler(prefix + module + '/' + chpwd, module));
        a.use(prefix, (req, res, next) => {
          if (req.user && req.user.needPwdReset()) {
            res.redirect(app.locals.baseUrl + (changePwdUrl || 'chpwd'));
            return;
          }
          next();
        });
      }

      if (profile) {
        a.get(prefix + module + '/' + profile, profileFormHandler(module, prefix + module + '/' + auth));
        a.post(prefix + module + '/' + profile, profileHandler(prefix + module + '/' + profile, success, module));
      }
    } else {

      a.use(prefix + module, verifier(prefix, module, chpwd));

      if (checkPwd) {
        a.post(prefix + module + '/' + checkPwd, checkPwdHandler());
      }

      if (chpwd) {
        a.get(prefix + module + '/' + chpwd, changePwdFormHandler(module));
        a.post(prefix + module + '/' + chpwd, changePwdHandler());
        a.use(prefix, (req, res, next) => {
          if (req.user && req.user.needPwdReset()) {
            res.redirect(app.locals.baseUrl + (changePwdUrl || 'chpwd'));
            return;
          }
          next();
        });
      }

      if (profile) {
        a.get(prefix + module + '/' + profile, profileFormHandler(module, prefix + 'auth'));
        a.post(prefix + module + '/' + profile, profileHandler());
      }

      a.get(prefix + module + '/sign-out', signOut(prefix + 'auth'));
    }
  };

  this.bindExternalAuth = function (a, nm, path, claim, success, fail) {
    const failureRedirect = fail || '/auth';

    function endMiddlware(req, res) {
      if (req.user) {
        req.session.lastActive = new Date();
        req.user.setProperties({ip: req.ip});
        res.redirect(req.session.authEntryPoint ? req.session.authEntryPoint : success || '/');
      } else {
        const message = __(Errors.NOT_AUTHENTICATED);
        return options.eventLogger.logChange(eventLoggerTypes.FAILURE, {name: nm, ip: req.ip, message})
          .then(() => {
            req.flash('error', message);
            res.redirect(failureRedirect);
          });
      }
    }

    a.use(path + '/auth/' + nm,
      function (req, res, next) {
        if (req.query.timezone) {
          req.session.clientTimeZone = req.query.timezone;
        }
        next();
      },
      passport.authenticate(nm, claim),
      endMiddlware
    );
    a.get(path + '/auth/' + nm + '/callback',
      passport.authenticate(nm, {failureRedirect}),
      endMiddlware
    );
  };

  /**
   * @param {String} type
   * @param {{}} mapping
   * @returns {Function}
   */
  function authHandlerConstructor(type, mapping) {
    return function (profile, done) {
      const user = {};

      user.type = type;

      if (profile.properties) {
        user.properties = profile.properties;
      }

      Object.keys(mapping).forEach((m) => {
        if (profile[mapping[m]]) {
          user[m] = profile[mapping[m]];
        }
      });

      user.id = user.id || user.name;

      if (!user.id) {
        return done(new IonError(Errors.BAD_USER_ID));
      }
      options.accounts.get(user.id + '@' + user.type)
        .then((u) => {
          if (u) {
            if (u.disabled) {
              throw new IonError(Errors.USER_BAN);
            }
            return options.accounts.set(user.id + '@' + user.type, user);
          }
          return options.accounts.register(user).then(u => 
            options.eventLogger.logChange(eventLoggerTypes.REGISTER, {id: u.id(), name: u.name(), ip: u.properties().ip})
              .then(() => u)
          );
        })
        .then((u) => {
          if (u) {
            _this.emit('login', u.id(), u.pwdHash(), u);
            return options.eventLogger.logChange(eventLoggerTypes.LOGIN, {id: u.id(), name: u.name(), ip: u.properties().ip})
              .then(() => done(null, u));
          }
          throw new IonError(Errors.EXT_AUTH_FAIL);
        })
        .catch(err => done(err));
    };
  }

  function topLevelSetup() {
    const prefix = url.parse(app.locals.baseUrl).pathname;
    app.get(prefix + 'last', function (req, res) {
      let last = lastVisit.get(req);
      if (last) {
        res.redirect(last);
      } else {
        res.sendStatus(404);
      }
    });
    if (!options.denyTopLevel && app) {
      app.get(prefix + 'auth', authFormHandler());

      app.get(prefix + 'register', registerFormHandler());

      app.get(prefix + 'sign-out', signOut(app.locals.baseUrl + 'auth'));

      app.post(prefix + 'register', cookieParser(), registerHandler(app.locals.baseUrl + 'register'));

      app.post(prefix + 'auth', cookieParser(), signInHandler(app.locals.baseUrl + 'auth'));

      app.post(prefix + 'checkPwd', checkPwdHandler());

      app.use(prefix, verifier());

      app.get(prefix + 'chpwd', changePwdFormHandler());

      app.post(prefix + 'chpwd', changePwdHandler(app.locals.baseUrl + 'chpwd'));

      app.use(prefix, (req, res, next) => {
        if (req.user && req.user.needPwdReset()) {
          res.redirect(app.locals.baseUrl + (changePwdUrl || 'chpwd'));
          return;
        }
        next();
      });

      app.get(prefix + 'profile', profileFormHandler());

      app.post(prefix + 'profile', profileHandler(app.locals.baseUrl + 'profile'));
    }
  }

  this.changePwdHandler = function (module, chpwd) {
    return changePwdHandler(app.locals.baseUrl + (module ? module + '/' : '') + (chpwd || 'chpwd'));
  };

  this.checkPwdHandler = function () {
    return checkPwdHandler();
  };

  this.profileHandler = function (module, profile) {
    return profileHandler(app.locals.baseUrl + (module ? module + '/' : '') + (profile || 'profile'));
  };

  function passportSetup() {
    passport.use('local', new LocalStrategy({
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: true
    }, signIn));

    let passports = options.passports;
    if (Array.isArray(options.passports)) {
      passports = {};
      options.passports.forEach((pc) => {
        passports[pc.name] = pc;
      });
    }

    if (passports && typeof passports === 'object') {
      for (let nm in passports) {
        if (passports.hasOwnProperty(nm)) {
          let pc = passports[nm];
          if (pc.strategy) {
            let strategy;
            let init = pc.options || {};
            init.auth = _this;
            if (pc.strategy instanceof StrategyProvider) {
              strategy = pc.strategy.getStrategy(init, authHandlerConstructor(nm, pc.mapping || {}));
            } else if (typeof pc.strategy == 'string') {
              let Strategy = require(pc.strategy);
              if (Strategy.Strategy) {
                Strategy = Strategy.Strategy;
              }
              strategy = new Strategy(init, authHandlerConstructor(nm, pc.mapping || {}));
            } else {
              throw new IonError(Errors.NO_STRATEGY, {nm});
            }
            passport.use(nm, strategy);

            if (!options.denyTopLevel && app) {
              _this.bindExternalAuth(app, nm, '', pc.claim || {}, pc.success || null);
            }
          }
        }
      }
    }

    passport.serializeUser(function (user, done) {
      done(null, user.id());
    });

    passport.deserializeUser(function (req, id, done) {
      if (!isNotStatic(req.originalUrl)) {
        return done(null, new User({id}));
      }
      return options.accounts.get(id)
          .then(user => done(null, user))
          .catch(err => done(err, null));
    });
  }

  /**
   * @returns {Promise}
   */
  this.init = function () {
    if (app) {
      app.use(passport.initialize());
      app.use(passport.session());
      passportSetup();
    }
    return ds.ensureIndex(failsRegistry, {username: 1}, {unique: true})
      .then(() => {
        if (!options.acl) {
          anon = new Anonymous({});
          return Promise.resolve();
        }
        return options.acl.getCoactors(ANON)
          .then((coactors) => {
            let tmp = {};
            coactors.forEach((a) => {
              tmp[a] = true;
            });
            anon = new Anonymous(tmp);
          });
      });
  };

  this.setTopLevelAuth = function () {
    topLevelSetup();
  };

  this.verifier = function (module) {
    return verifier(null, module);
  };

  function pathForCheck(chua, path) {
    for (let i = 0; i < chua.length; i++) {
      if (chua[i] === path || (chua[i] + '/') === path || chua[i] === (path + '/')) {
        return true;
      }
      try {
        let chk = new RegExp(chua[i]);
        if (chk.test(path)) {
          return true;
        }
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  this.checkPathAccess = function (req, path) {
    if (
      options.acl &&
      (
        options.checkUrlAccess === true ||
        (
          Array.isArray(options.checkUrlAccess) &&
          pathForCheck(options.checkUrlAccess, path)
        )
      )
    ) {
      let user = _this.getUser(req);
      return checkPathAccess(user, path);
    }
    return Promise.resolve(true);
  };

  /**
   * @param {{}} req
   * @returns {User}
   */
  this.getUser = function (req) {
    if (req.user) {
      if (req.user instanceof User) {
        if (req.session) {
          req.user.setCoactors(req.session.coactors);
          req.user.setTz(req.session.clientTimeZone);
        }
      } else {
        req.user = new User(
          req.user,
          req.session && req.session.coactors || {},
          req.session && req.session.clientTimeZone);
      }
      if (req.session) {
        let sessData = clone(req.session);
        delete sessData.coactors;
        delete sessData.clientTimeZone;
        req.user.setProperties(sessData);
      }
      return req.user;
    }
    return anon;
  };

  this.userSearch = function (sv) {
    return options.accounts.search(sv)
      .then((list) => {
        let result = [];
        list.forEach((u) => {
          result.push(u.id());
        });
        return result;
      });
  };

  /**
   * @param {{}} req
   * @param {User} user
   */
  this.forceUser = function (req, user) {
    req.user = user;
  };

  this.disableUser = function (id) {
    return options.accounts.disable(id);
  };

  this.enableUser = function (id) {
    return options.accounts.enable(id);
  };
}

util.inherits(Auth, EventEmitter);

module.exports = Auth;
