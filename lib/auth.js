// jscs:disable requireCapitalizedComments
/**
 * Created by kras on 20.02.16.
 */
'use strict';

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const pwdHasher = require('password-hash-and-salt');
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
 * @param {String | Number} time
 * @return {{value: String, unit: String} | null}
 */
function parseDuration(time) {
  var result;
  if (time && typeof time === 'string') {
    let match = time.match(/(\d+)([s|m|h|d|y])/);
    if (match && match[1]) {
      result = {
        value: match[1],
        unit: match[2] ? match[2] : 'm'
      };
    }
  }
  if (time && typeof time === 'number') {
    result = {value: time, unit: 'm'};
  }
  return result;
}

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
    var uid = id.split('@');

    ds.fetch('ion_user', {
      filter: {
        [F.AND]: [
          {[F.EQUAL]: ['$type', uid[1]]},
          {[F.EQUAL]: ['$id', uid[0]]}
        ]
      }
    }).then(function (result) {
      if (result[0]) {
        delete result[0].pwd;
      }
      return new User(result[0]);
    }).then(callback).catch((err) => {log.error(err);callback(null);});
  };

  this.register = function (user, callback) {
    user.type = UserTypes.LOCAL;

    if (!user.name) {
      user.name = user.email;
    }

    if (!user.id) {
      user.id = user.name;
    }

    if (user.pwd) {
      var hasher = pwdHasher(user.pwd);
      hasher.hash(function (err, hash) {
        user.pwd = hash;
        user.pwdDate = new Date();
        user.disabled = false;
        ds.insert('ion_user', user)
          .then(function (u) {
            callback(null, u);
          })
          .catch(function (err) {
            callback(err, null);
          });
      });
    } else {
      callback(new Error('Не передан пароль'), null);
    }
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
        .checkAccess(user.name + '@' + user.type, signInResource + (module ? ':' + module : ''), Permissions.USE)
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
    return function (fail) {
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
    let checker = pwdHasher(password);
    if (username.indexOf('@') > 0) {
      let un = username.split('@');
      username = un[0];
      type = un[1];
    }
    return ds.get('ion_user',
      {
        [F.AND]: [
          {[F.EQUAL]: ['$type', type || UserTypes.LOCAL]},
          {[F.EQUAL]: ['$id', username]},
          {
            [F.OR]: [
              {[F.EQUAL]: ['$disabled', false]},
              {[F.EMPTY]: ['$disabled']}
            ]
          }
        ]
      })
      .then(user => {
          if (user) {
            if (!user.pwd) {
              if (passwordMinLength) {
                return Promise.reject(new Error('Учетная запись не защищена паролем.'));
              }
              return Promise.resolve(user);
            }
            return new Promise(function (resolve, reject) {
              checker.verifyAgainst(user.pwd, function (err, verified) {
                if (verified) {
                  return resolve(user);
                }
                if (!err) {
                  err = new Error('Неверно указан пароль.');
                }
                return reject(err);
              });
            });
          }
          let err = new Error('Пользователь не зарегистрирован.');
          return Promise.reject(err);
        }
      );
  }

  this.signIn = function (username, password, type) {
    return signInMin(username, password, type).then((u) => new User(u));
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
    if (req.isAuthenticated() && req.user && req.user[0]) {
      _this.emit('logout', req.user[0]);
      logAuthEvent(req.user[0].name, 'sign out');
      req.logout();
    }
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
    var promises = [];
    var fields = {};
    for (let plugin of profilePlugins) {
      promises.push(cb(plugin));
    }
    return Promise.all(promises)
        .then(results => {
          if (results && results.length) {
            for (let result of results) {
              fields = Object.assign(fields, result);
            }
          }
          return fields;
        });
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
        .catch(err => res.sendStatus(404));
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
      .catch(err => res.sendStatus(404));
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
      return res.redirect(redirect || (module ? '/' + module : '') + '/auth');
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
            req.logIn(user, function (err) {
              if (err) {
                return next(err);
              }
              req.session.lastActive = new Date();
              _this.emit('login', req.body.username, req.body.password);
              var redir = req.session.authEntryPoint ?
                req.session.authEntryPoint : success || '/';
              delete req.session.authEntryPoint;
              if (options.acl) {
                let u = new User(user);
                return options.acl.getCoactors(u.id())
                 .then((coactors)=> {
                  req.session.coactors = {};
                  coactors.forEach((a)=> {
                    req.session.coactors[a] = true;
                  });
                  res.redirect(redir);
                })
                 .catch(()=>res.redirect(redir));
              }
              return res.redirect(redir);
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
        .then(output => {
          let updates = {};
          for (let nm in output) {
            if (output.hasOwnProperty(nm)) {
              updates['properties.' + nm] = output[nm];
            }
          }
          return ds.update(
            'ion_user',
            {
              [F.AND]: [
                {[F.EQUAL]: ['$id', req.user[0].id]},
                {[F.EQUAL]: ['$type', req.user[0].type]}
              ]
            },
            updates
          );
        })
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
    if (user.type === 'esia') {
      return true;
    }
    return isBefore(passwordLifetime, user.pwdDate);
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

  function verifier(redirect, module) {
    return function (req, res, next) {
      if (req.path === (module ? '/' + module : '') + '/chpwd') {
        return next();
      }
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
        if (isNotStatic(req.originalUrl)) {
          req.session.authEntryPoint = req.originalUrl;
        }
        return res.redirect(redirect || (module ? '/' + module : '') + '/auth');
      } else if (!livePassword(_this.getUser(req))) {
        return _changePwd(req, res, (module ? '/' + module : '') + '/chpwd');
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
      _this.emit('verify', req.user[0], function () {
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
    return function (req, res, next) {
      if (req.isAuthenticated()) {
        renderChangePwdForm(req, res, module);
      } else {
        res.sendStatus(403);
      }
    };
  }

  function changePwdHandler(self, module) {
    return function (req, res, next) {
      if (req.isAuthenticated()) {
        validatePassword(req.body, function (err) {
          if (err) {
            req.flash('error', err);
            return res.redirect(self);
          }

          let hasher = pwdHasher(req.body.password);
          hasher.verifyAgainst(req.user[0].pwd, function (err, verified) {
            if (err) {
              req.flash('error', 'Не удалось поменять пароль!');
              return res.redirect(self);
            }
            if (verified) {
              req.flash('error', 'Необходимо ввести новый пароль!');
              return res.redirect(self);
            }
            hasher.hash(function (err, hash) {
              let pwd = hash;
              let pwdDate = new Date();
              ds.update('ion_user', {[F.EQUAL]: ['$id', req.user[0].id]}, {pwd, pwdDate}).then(function (u) {
                _exit(req, res, (module ? '/' + module : '') + '/auth');
              }).catch(function (err) {
                req.flash('error', 'Не удалось поменять пароль!');
                return res.redirect(self);
              });
            });
          });
        });
      } else {
        res.sendStatus(403);
      }
    };
  }

  this.bindAuth = function (a, module, routes) {
    let {auth, register, success, chpwd, profile} = routes || {};
    auth = auth !== false ? auth || 'auth' : auth;
    register = register !== false ? register || 'register' : register;
    success = success || '/' + module;
    let prefix = module ? '/' : '';
    if (options.denyTopLevel) {
      if (auth) {
        a.get(prefix + module + '/' + auth, authFormHandler(success, module));
        a.get(prefix + module + '/sign-out', signOut(prefix + module + '/' + auth));
      }
      if (register) {
        a.get(prefix + module + '/' + register, registerFormHandler(module));
      }
      if (register) {
        a.post(prefix + module + '/' + register, registerHandler(prefix + module + '/' + register, success, module));
      }
      if (auth) {
        a.post(prefix + module + '/' + auth, signInHandler(prefix + module + '/' + auth, success, module));
      }
      a.use(prefix + module, verifier(prefix + module + '/' + auth, module));
      if (profile) {
        a.get(prefix + module + '/' + profile, profileFormHandler(module, prefix + module + '/' + auth));
        a.post(prefix + module + '/' + profile, profileHandler(prefix + module + '/profile', success, module));
      }
      if (chpwd) {
        a.get(prefix + module + '/' + chpwd, changePwdFormHandler(module));
        a.post(prefix + module + '/' + chpwd, changePwdHandler(prefix + module + '/' + chpwd, module));
      }
    } else {
      if (profile) {
        a.get(prefix + module + '/' + profile, profileFormHandler(module));
        a.post(prefix + module + '/' + profile, profileHandler());
      }
      if (chpwd) {
        a.get(prefix + module + '/' + chpwd, changePwdFormHandler(module));
        a.post(prefix + module + '/' + chpwd, changePwdHandler());
      }
      if (auth) {
        a.get(prefix + module + '/sign-out', signOut(prefix + module + '/' + auth));
      }
    }
  };

  this.bindExternalAuth = function (a, nm, path, claim, success, fail) {
    console.log(path + '/auth/' + nm);
    a.get(path + '/auth/' + nm, passport.authenticate(nm, claim));
    a.get(path + '/auth/' + nm + '/callback',
      passport.authenticate(nm, {failureRedirect: fail || '/auth'}),
      function (req, res) {
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

      if (user.id) {
        ds.fetch('ion_user', {
          filter: {
            [F.AND]: [
              {[F.EQUAL]: ['$type', user.type]},
              {[F.EQUAL]: ['$id', user.id]}
            ]
          }
        }).then(function (users) {
          if (users.length > 0) {
            if (users[0].blocked) {
              return done('Пользователь заблокирован.');
            }
            return done(null, users[0]);
          }

          ds.insert('ion_user', user).then(function (user) {
            if (user) {
              return done(null, user);
            } else {
              return done('Не удалось зарегистрировать пользователя из внешней системы.');
            }
          }).catch(
            function (err) {
              done(err, false);
            }
          );
        }).catch(
          function (err) {
            done(err);
          }
        );
      } else {
        return done('Не удалось определить идентификатор пользователя.');
      }
    };
  }

  function topLevelSetup() {
    if (!options.denyTopLevel && app) {
      app.get('/auth', authFormHandler());

      app.get('/register', registerFormHandler());

      app.get('/sign-out', signOut());

      app.post('/register', registerHandler('/register'));

      app.post('/auth', signInHandler('/auth'));

      app.use('/', verifier());

      app.get('/chpwd', changePwdFormHandler());

      app.get('/profile', profileFormHandler());

      app.post('/chpwd', changePwdHandler('/chpwd'));

      app.post('/profile', profileHandler('/profile'));
    }
  }

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
            _this.bindExternalAuth(app, nm, '', pc.options.claim);
          }
        }
      }
    }

    passport.serializeUser(function (user, done) {
      done(null, user.id + '@' + user.type);
    });

    passport.deserializeUser(function (data, done) {
      var uid = data.split('@');
      ds.fetch('ion_user', {
        filter: {
          [F.AND]: [
            {[F.EQUAL]: ['$type', uid[1]]},
            {[F.EQUAL]: ['$id', uid[0]]}
          ]
        }
      }).then(function (user) {
        done(null, user);
      }).catch(
        function (err) {
          done(err, null);
        }
      );
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
    return ds.ensureIndex('ion_user', {type: 1, id: 1}, {unique: true})
      .then(()=>ds.ensureIndex(failsRegistry, {username: 1}, {unique: true}))
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
    if (req.user instanceof User) {
      return req.user;
    }
    let u = Array.isArray(req.user) ? req.user[0] : req.user;
    if (u) {
      return new User(u, req.session.coactors);
    }
    return anon;
  };

  this.userSearch = function (sv) {
    return options.dataSource
      .fetch('ion_user',
        {
          filter: {
            [F.AND]: [
              {[F.LIKE]: ['$id', '^' + sv + '\\w*']},
              {[F.EQUAL]: ['$type', UserTypes.LOCAL]}
            ]
          },
          count: 10
        })
      .then((list) => {
        let result = [];
        list.forEach((u) => {
          let tmp = new User(u);
          result.push(tmp.id());
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
    return ds.update('ion_user', {[F.EQUAL]: ['$id', id]}, {disabled: true}).then(()=>true);
  };

  this.enableUser = function (id) {
    return ds.update('ion_user', {[F.EQUAL]: ['$id', id]}, {disabled: false}).then(()=>true);
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
