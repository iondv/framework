// jscs:disable requireCapitalizedComments
/**
 * Created by kras on 20.02.16.
 */
'use strict';

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const clone = require('clone');
const LoggerProxy = require('core/impl/log/LoggerProxy');
const ProfilePlugin = require('lib/interfaces/ProfilePlugin');
const EventEmitter = require('events');
const util = require('util');
const moment = require('moment');
const Permissions = require('core/Permissions');
const locale = require('locale');
const User = require('core/User');
const UserTypes = require('core/UserTypes');
const F = require('core/FunctionCodes');
const cookieParser = require('cookie-parser');
const lastVisit = require('lib/last-visit');
const parseDuration = require('lib/duration');

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
  var time1 = moment().subtract(value, unit);
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
 * @param {{}} [options.app]
 * @param {AclProvider} [options.acl]
 * @param {Object[]} [options.passports]
 * @param {String[]} [options.authCallbacks]
 * @param {Boolean} [options.denyTopLevel]
 * @param {Boolean} [options.publicRegistration]
 * @param {String[]} [options.exclude]
 * @param {{}} [options.authFormFields]
 * @param {Integer} [options.inactiveTimeout]
 * @param {Integer} [options.passwordLifetime]
 * @param {Integer} [options.passwordMinLength]
 * @param {Integer} [options.attemptTimeOut]
 * @param {Integer} [options.attemptLimit]
 * @param {Integer} [options.tempBlockPeriod]
 * @param {Integer} [options.tempBlockLimit]
 * @param {Integer} [options.tempBlockInterval]
 * @param {Integer} [options.blockPeriod]
 * @param {Boolean} [options.checkSignInAccess]
 * @param {Boolean} [options.checkUrlAccess]
 * @param {Boolean} [options.restoreLastRequest]
 */
function Auth(options) {
  var _this = this;

  var exclude = options.exclude || [];
  var inactiveTimeout = parseDuration(options.inactiveTimeout || '15m');
  var passwordLifetime = parseDuration(options.passwordLifetime || '100y');
  var passwordMinLength = options.passwordMinLength || 0;
  var attemptTimeOut = parseDuration(options.attemptTimeOut || '24h');
  var attemptLimit = options.attemptLimit || 0;
  var tempBlockTimeOut = parseDuration(options.tempBlockPeriod || '15m');
  var tempBlockLimit = options.tempBlockLimit || 3;
  var tempBlocksPeriod = parseDuration(options.tempBlockInterval || '24h');
  var fullBlockTimeOut = parseDuration(options.blockPeriod || '120d');

  if (options.restoreLastRequest === false) {
    lastVisit.disable();
  } else {
    lastVisit.enable();
  }

  /**
   * @type {Array.<ProfilePlugin>}
   */
  var profilePlugins = [];

  /**
   * @type {DataSource}
   */
  var ds = options.dataSource;

  var app = options.app;

  var log = options.logger || new LoggerProxy();

  var anon;

  if (!ds) {
    throw new Error('Не настроен источник данных аутентификации.');
  }

  this.authOptions = function () {
    return {
      passwordMinLength
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
    let uid = id.split('@');
    let user, u, ca = {};

    ds.fetch('ion_user',
      {
        filter: {
          [F.AND]: [
            {[F.EQUAL]: ['$type', uid[1]]},
            {[F.EQUAL]: ['$id', uid[0]]}
          ]
        }
      })
      .then(
        (result) => {
          if (!result.length) {
            return null;
          }
          delete result[0].pwd;
          user = result[0];
          u = new User(user);
          return (options.acl ? options.acl.getCoactors(u.id()) : []);
        }
      )
      .then(
        (coactors)=> {
          if (user) {
            coactors.forEach((a)=> {
              ca[a] = true;
            });
            return pluginAction((plugin) => plugin.properties(u.id()));
          }
        }
      )
      .then(
        (data) => {
          if (user) {
            user.properties = Object.assign(user.properties || {}, data);
            return new User(user, ca);
          }
        }
      )
      .then(callback)
      .catch((err) => {
        log.error(err);
        callback(null);
      });
  };

  this.register = function (user, callback) {
    options.accounts.register(user).then((u) => callback(null, u)).catch(callback);
  };

  function regAuthFail(username, fail) {
    var now = new Date();
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
        .checkAccess(user.id(), signInResource + (module ? ':' + module : ''), Permissions.USE)
        .then(can => {
          if (!can) {
            let err = new Error('Недостаточно прав для входа.');
            err.failInfo = true;
            return Promise.reject(err);
          }
          return Promise.resolve(user);
        });
    }
    return Promise.resolve(user);
  }

  function logAuthEvent(username, type, message) {
    return ds.insert(authLog, {
      time: new Date(),
      user: username,
      event: type,
      info: message
    }, {skipResult: true}).catch(err => log.error(err));
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
    d.locale(locales[0].language);
    let err = new Error('Учетная запись заблокирована до ' + d.format('L LT'));
    err.failInfo = fail;
    return err;
  }

  function signInMin(username, password, type) {
    if (username.indexOf('@') < 0 && type) {
      username = username + '@' + type;
    }
    let result;
    return options.accounts.get(username, password)
      .then((user) => {
        result = user;
        return pluginAction((plugin) => plugin.properties(user.id()));
      })
      .then((data) => {
        result.setProperties(data);
        return result;
      });
  }

  this.signIn = function (username, password, type) {
    return signInMin(username, password, type);
  };

  function signIn(req, username, password, done) {
    ds.get(failsRegistry, {[F.EQUAL]: ['$username', username]})
      .then(fail => {
        if (fail && fail.blockedTill) {
          if (moment().isBefore(fail.blockedTill)) {
            return Promise.reject(throwBlocked(fail, req));
          } else {
            return ds.update(failsRegistry, {[F.EQUAL]: ['$username', username]}, {blockedTill: null});
          }
        }
        return Promise.resolve(fail);
      })
      .then(fail => {
          return signInMin(username, password).catch(error=> {
            error.failInfo = fail || null;
          });
        })
      .then(user => {
        return ds.delete(failsRegistry, {[F.EQUAL]: ['$username', username]})
          .then(()=>aclChecker(user, req.module));
      })
      .then(user => {
        done(null, user);
        logAuthEvent(username, 'sign in');
      })
      .catch(err => {
        if (typeof err.failInfo !== 'undefined') {
          regAuthFail(username, err.failInfo)
            .then((fail) => {
              if (fail.blockedTill) {
                err = throwBlocked(fail, req);
              }
              onAuthFail(username, err, done)();
            })
            .catch(onAuthFail(username, err, done));
        } else {
          onAuthFail(username, err, done)();
        }
      });
  }

  function _exit(req, res, exit) {
    if (req.isAuthenticated() && req.user) {
      _this.emit('logout', req.user);
      logAuthEvent(req.user.id(), 'sign out');
      req.logout();
    }
    delete req.session.coactors;
    delete req.session.authEntryPoint;
    res.redirect(exit || '/auth');
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
      errors: req.flash('error')
    });
  }

  function pluginAction(cb) {
    var promises = Promise.resolve();
    var fields = {};
    Object.values(profilePlugins).forEach(
      (plugin) => {
        promises = promises
          .then(() => cb(plugin))
          .then((result) => {
            fields = Object.assign(fields, result);
          });
      }
    );
    return promises.then(() => fields);
  }

  function profileFields() {
    return pluginAction(plugin => plugin.fields());
  }

  this.profileFields = function () {
    return profileFields();
  };

  function validate(data) {
    return pluginAction(plugin => plugin.validate(data));
  }

  function renderRegisterForm(req, res, module) {
    if (!options.publicRegistration) {
      res.sendStatus(404);
    } else {
      profileFields()
        .then(fields => {
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
    profileFields()
      .then(fields => {
        res.status(200).render('profile', {
          user: _this.getUser(req),
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
      if (req.isAuthenticated()) {
        delete req.session.authEntryPoint;
        req.logout();
      }
      renderRegisterForm(req, res, module);
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
        req.flash('error', 'Не указан пароль пользователя!');
        return res.redirect(self);
      }
      if (req.body.timezone) {
        req.session.clientTimeZone = req.body.timezone;
      }
      passport.authenticate('local',
        function (err, user) {
          if (err) {
            if (typeof err.failInfo === 'undefined') {
              log.error(err);
              req.flash('error', 'Внутренняя ошибка сервера');
            } else {
              req.flash('error', typeof err === 'string' ? err : err.message);
            }
            res.redirect(self);
          } else if (user) {
            req.logIn(user, (err) => {
              if (err) {
                return next(err);
              }
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
              delete req.session.authEntryPoint;

              return (options.acl ? options.acl.getCoactors(user.id()) : Promise.resolve([]))
                .then((coactors)=> {
                  req.session.coactors = {};
                  coactors.forEach((a)=> {
                    req.session.coactors[a] = true;
                  });
                  res.redirect(redir);
                })
                .catch((e) => {
                  log.error(e);
                  res.redirect(redir);
                });
            });
          } else {
            req.flash('error', 'Не удалось выполнить вход.');
            res.redirect(self);
          }
        })(req, res, next);
    };
  }

  function validatePassword(body, cb) {
    if (!body.password) {
      return cb('Не передан пароль!', false);
    }

    if (body.password !== body.password2) {
      return cb('Неверно выполнен повтор пароля!', false);
    }

    if (body.password.length < passwordMinLength) {
      return cb('Минимальная длина пароля: ' + passwordMinLength + ' символов', false);
    }

    return cb(null, true);
  }

  function registerHandler(self, success, module) {
    return function (req, res, next) {
      if (!options.publicRegistration) {
        req.flash('error', 'Публичная регистрация пользователей запрещена!');
        return res.redirect(self);
      }

      validatePassword(req.body, function (err) {
        if (err) {
          req.flash('error', err);
          return res.redirect(self);
        }

        let user = {
          name: req.body.username,
          pwd: req.body.password
        };

        validate(req.body)
          .then(output => {
            user.properties = output || {};
            return user;
          })
          .then(user => {
            _this.register(user, function (err) {
              if (err) {
                log.error(err);
                req.flash('error', 'Не удалось зарегистрировать пользователя!');
                return res.redirect(self);
              }
              signInHandler(self, success, module)(req, res, next);
            });
          })
          .catch(err => {
            log.error(err);
            req.flash('error', 'Не удалось зарегистрировать пользователя!');
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
        .then(output => options.accounts.set(req.user.id(), output))
        .then(user => {
          req.logIn(user, function (err) {
            if (err) {
              return next(err);
            }
            _this.emit('edit-profile', user);
            return res.redirect(self || '/profile');
          });
        })
        .catch(err => {
          log.error(err);
          req.flash('error', 'Не удалось внести изменения в профиль пользователя!');
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
    return options.acl.checkAccess(user, pthRes(path), Permissions.USE)
      .then((can)=> {
        if (!can && path.substr(-2) !== '/*') {
          return options.acl.checkAccess(user, pthRes(path) + '/*', Permissions.USE);
        }
        return can;
      })
      .then((can)=> {
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
      var pth = (module ? '/' + module : '') + req.path;
      if (Array.isArray(exclude)) {
        var reg, tmp;
        for (var i = 0; i < exclude.length; i++) {
          if (exclude[i]) {
            try {
              tmp = exclude[i];
              if (tmp[0] !== '^') {
                tmp = '^' + tmp;
              }
              if (tmp[tmp.length - 1] !== '$') {
                tmp = tmp + '$';
              }
              reg = new RegExp(tmp);
              if (reg.test(pth)) {
                return next();
              }
            } catch (e) {
            }

            try {
              tmp = exclude[i];
              if (tmp[0] !== '/') {
                tmp = '/' + tmp;
              }
              tmp = '^' + tmp.replace(/\*\*/g, '.*').replace(/\\/g, '\\\\').replace(/\//g, '\\/') + '$';
              reg = new RegExp(tmp);
              if (reg.test(pth)) {
                return next();
              }
            } catch (e) {

            }
          }
        }
      }
      if (!req.isAuthenticated()) {
        if (isNotStatic(req.originalUrl) && !req.xhr && !req.session.authEntryPoint) {
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
      if (options.acl && options.checkUrlAccess && req.path && path !== '/') {
        let user = _this.getUser(req);
        checkPathAccess(user.id(), path)
          .then((can)=> {
            if (!can) {
              return res.sendStatus(403);
            }
            req.session.lastActive = new Date();
            _this.emit('verify', user, function () {
              _exit(req, res, redirect || (module ? '/' + module : '') + '/auth');
            });
            next();
          })
          .catch((err)=> {
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
        validatePassword(req.body, function (err) {
          if (err) {
            req.flash('error', err);
            return res.redirect(self);
          }

          options.accounts
            .setPassword(req.user.id(), req.user.pwd(), req.body.password)
            .then(() => {
              _exit(req, res, (module ? '/' + module : '') + '/auth');
            }).catch((err) => {
            req.flash('error', err.message);
              return res.redirect(self);
            });
        });
      } else {
        res.sendStatus(403);
      }
    };
  }

  this.bindAuth = function (a, module, routes) {
    let prefix = app.locals.baseUrl;
    let {auth, register, success, chpwd, profile} = routes || {};
    auth = auth !== false ? auth || 'auth' : auth;
    register = register !== false ? register || 'register' : register;
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
      if (auth) {
        a.use(prefix + module, verifier(prefix + module + '/' + auth, module, chpwd));
      } else {
        a.use(prefix + module, verifier(prefix, module, chpwd));
      }
      if (profile) {
        a.get(prefix + module + '/' + profile, profileFormHandler(module, prefix + module + '/' + auth));
        a.post(prefix + module + '/' + profile, profileHandler(prefix + module + '/' + profile, success, module));
      }
      if (chpwd) {
        a.get(prefix + module + '/' + chpwd, changePwdFormHandler(module));
        a.post(prefix + module + '/' + chpwd, changePwdHandler(prefix + module + '/' + chpwd, module));
      }
    } else {
      if (profile) {
        a.get(prefix + module + '/' + profile, profileFormHandler(module, prefix + 'auth'));
        a.post(prefix + module + '/' + profile, profileHandler());
      }
      if (chpwd) {
        a.get(prefix + module + '/' + chpwd, changePwdFormHandler(module));
        a.post(prefix + module + '/' + chpwd, changePwdHandler());
      }
      a.get(prefix + module + '/sign-out', signOut(prefix + 'auth'));
    }
  };

  this.bindExternalAuth = function (a, nm, path, claim, success, fail) {
    a.get(path + '/auth/' + nm, passport.authenticate(nm, claim));
    a.get(path + '/auth/' + nm + '/callback',
      passport.authenticate(nm, {failureRedirect: fail || '/auth'}),
      function (req, res) {
        req.session.lastActive = new Date();
        res.redirect(req.session.authEntryPoint ? req.session.authEntryPoint : success || '/');
      }
    );
  };

  /**
   * @param {String} type
   * @param {{}} pc
   * @param {{}} pc.options
   * @param {{}} pc.options.mapping
   * @returns {Function}
   */
  function authHandlerConstructor(type, pc) {
    return function (accessToken, refreshToken, profile, done) {
      var user = {};

      user.type = type;

      if (pc.options.mapping.id) {
        user.id = profile[pc.options.mapping.id];
      }

      if (pc.options.mapping.name) {
        user.name = profile[pc.options.mapping.name];
        if (!user.id) {
          user.id = user.name;
        }
      }

      if (pc.options.mapping.ava) {
        user.ava = profile[pc.options.mapping.ava];
      }

      if (pc.options.mapping.url) {
        user.url = profile[pc.options.mapping.url];
      }

      Object.keys(pc.options.mapping).forEach(m => {
        if (['id', 'name', 'ava', 'url'].indexOf(m) < 0 && profile[pc.options.mapping[m]]) {
          user[m] = profile[pc.options.mapping[m]];
        }
      });

      if (user.id) {
        options.accounts.get(user.id + '@' + user.type)
          .then(
            (u) => {
              if (u) {
                if (u.disabled) {
                  throw new Error('Пользователь заблокирован.');
                }
                return u;
              }

              return options.accounts.register(user);
            })
          .then(
            (u) => {
              if (u) {
                _this.emit('login', u.id(), u.pwdHash(), u);
                return done(null, u);
              }
              throw new Error('Не удалось зарегистрировать пользователя из внешней системы.');
            })
          .catch((err) => done(err));
      } else {
        return done('Не удалось определить идентификатор пользователя.');
      }
    };
  }

  function topLevelSetup() {
    app.get(app.locals.baseUrl + 'last', function (req, res) {
      let last = lastVisit.get(req);
      res.redirect(app.locals.baseUrl + (last || ''));
    });
    if (!options.denyTopLevel && app) {
      app.get(app.locals.baseUrl + 'auth', authFormHandler());

      app.get(app.locals.baseUrl + 'register', registerFormHandler());

      app.get(app.locals.baseUrl + 'sign-out', signOut(app.locals.baseUrl + 'auth'));

      app.post(app.locals.baseUrl + 'register', cookieParser(), registerHandler(app.locals.baseUrl + 'register'));

      app.post(app.locals.baseUrl + 'auth', cookieParser(), signInHandler(app.locals.baseUrl + 'auth'));

      app.use(app.locals.baseUrl, verifier());

      app.get(app.locals.baseUrl + 'chpwd', changePwdFormHandler());

      app.get(app.locals.baseUrl + 'profile', profileFormHandler());

      app.post(app.locals.baseUrl + 'chpwd', changePwdHandler(app.locals.baseUrl + 'chpwd'));

      app.post(app.locals.baseUrl + 'profile', profileHandler(app.locals.baseUrl + 'profile'));
    }
  }

  this.changePwdHandler = function (module, chpwd) {
    return changePwdHandler(app.locals.baseUrl + (module ? module + '/' : '') + (chpwd || 'chpwd'));
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

    if (typeof options.passports !== 'undefined') {
      for (var i = 0; i < options.passports.length; i++) {
        var pc = options.passports[i];

        if (pc && typeof pc === 'object' && pc.name && pc.module && pc.options && pc.options.mapping) {
          var nm = pc.name;
          var module = pc.module;
          var Strategy = require(module).Strategy;

          var init = pc.options.init || {};

          passport.use(nm, new Strategy(init, authHandlerConstructor(nm, pc)));

          if (!options.denyTopLevel && app) {
            _this.bindExternalAuth(app, nm, '', pc.options.claim, pc.options.success);
          }
        }
      }
    }

    passport.serializeUser(function (user, done) {
      done(null, user.id());
    });

    passport.deserializeUser(function (data, done) {
      let result;
      options.accounts.get(data)
        .then((user) => {
          if (user) {
            result = user;
            return pluginAction((plugin) => plugin.properties(user.id()));
          }
          return {};
        })
        .then((data) => {
          if (result) {
            result.setProperties(data);
          }
          done(null, result);
        })
        .catch((err) => done(err, null));
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
      .then(()=> {
        if (!options.acl) {
          anon = new Anonymous({});
          return Promise.resolve();
        }
        return options.acl.getCoactors(ANON)
          .then((coactors)=> {
            let tmp = {};
            coactors.forEach((a)=> {
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

  this.checkPathAccess = function (req, path) {
    if (options.acl && options.checkUrlAccess) {
      let user = _this.getUser(req);
      return checkPathAccess(user.id(), path);
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
        req.user.setCoactors(req.session.coactors);
        req.user.setTz(req.session.clientTimeZone);
      } else {
        req.user = new User(req.user, req.session.coactors, req.session.clientTimeZone);
      }
      let sessData = clone(req.session);
      delete sessData.coactors;
      delete sessData.clientTimeZone;
      req.user.setProperties(sessData);
      return req.user;
    }
    return anon;
  };

  this.getUsers = function () {
    return ds.fetch('ion_user', {});
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
    req.session = req.session || {};
    req.session.coactors = user.coactors();
    req.session.clientTimeZone = user.timeZone();
  };

  this.disableUser = function (id) {
    return options.accounts.disable(id);
  };

  this.enableUser = function (id) {
    return options.accounts.enable(id);
  };

  /**
   *
   * @param {ProfilePlugin} plugin
   */
  this.addProfilePlugin = function (plugin) {
    if (plugin && plugin instanceof ProfilePlugin) {
      profilePlugins.push(plugin);
    }
  };
}

util.inherits(Auth, EventEmitter);

module.exports = Auth;
