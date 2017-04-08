// jscs:disable requireCapitalizedComments
/**
 * Created by kras on 20.02.16.
 */
'use strict';

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var pwdHasher = require('password-hash-and-salt');
var LoggerProxy = require('core/impl/log/LoggerProxy');
const ProfilePlugin = require('core/interfaces/ProfilePlugin');
const EventEmitter = require('events');
const util = require('util');
const moment = require('moment');

// jshint maxstatements: 90, maxcomplexity: 90
/**
 * @param {{dataSource: DataSource}} options
 * @param {{}} [options.app]
 * @param {Object[]} [options.passports]
 * @param {String[]} [options.authCallbacks]
 * @param {Boolean} [options.denyTopLevel]
 * @param {Boolean} [options.publicRegistration]
 * @param {String[]} [options.exclude]
 * @param {{}} [options.authFormFields]
 * @param {Integer} [options.inactiveTimeout]
 * @param {Integer} [options.passwordLifetime]
 * @param {Integer} [options.passwordMinLength]
 */
function Auth(options) {
  var _this = this;

  var exclude = options.exclude || [];
  var inactiveTimeout = options.inactiveTimeout || 15; // minutes
  var passwordLifetime = options.passwordLifetime || 120; // days
  var passwordMinLength = options.passwordMinLength || 6;

  /**
   * @type {Array.<ProfilePlugin>}
   */
  var profilePlugins = [];

  /**
   * @type {DataSource}
   */
  this.ds = options.dataSource;

  this.app = options.app;

  var log = options.logger || new LoggerProxy();

  if (!this.ds) {
    throw new Error('Не настроен источник данных аутентификации.');
  }

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

    _this.ds.fetch('ion_user', {
      filter: {
        type: uid[1],
        id: uid[0]
      }
    }).then(function (result) {
      if (result[0]) {
        delete result[0].pwd;
      }
      return result;
    }).then(callback);
  };

  this.register = function (user, callback) {
    user.type = 'local';

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
        _this.ds.insert('ion_user', user).then(function (u) {
          callback(null, u);
        }).catch(function (err) {
          callback(err, null);
        });
      });
    } else {
      callback(new Error('не передан пароль'), null);
    }
  };

  this.signIn = function (username, password, done) {
    var checker = pwdHasher(password);
    _this.ds.fetch('ion_user',
      {
        filter: {
          type: 'local',
          id: username
        }
      }).then(function (users) {
      if (users.length > 0) {
        if (!users[0].pwd) {
          return done(null, users[0]);
        } else {
          checker.verifyAgainst(users[0].pwd, function (err, verified) {
            if (verified) {
              return done(null, users[0]);
            } else {
              if (err) {
                return done(err, false);
              }

              done(null, false, {
                message: 'Неверно указан пароль.'
              });
            }
          });
        }
      } else {
        done(null, false, {
          message: 'Пользователь не зарегистрирован.'
        });
      }
    }).catch(function (err) {
      done(err, false);
    });
  };

  function _exit(req, res, exit) {
    delete req.session.authEntryPoint;
    req.logout();
    res.redirect(exit || '/auth');
  }

  function _changePwd(req, res, redirect) {
    res.redirect(redirect || '/chpwd');
  }

  this.signOut = function (exit) {
    return function (req, res) {
      _exit(req, res, exit || '/auth');
    };
  };

  var renderAuthForm = function (req, res, module) {
    res.status(401).render('login', {
      module: module,
      canRegister: options.publicRegistration,
      errors: req.flash('error')
    });
  };

  function pluginAction(cb) {
    return new Promise(function (resolve, reject) {
      let promises = [];
      let fields = {};
      for (let plugin of profilePlugins) {
        promises.push(cb(plugin));
      }
      Promise.all(promises)
        .then(results => {
          if (results && results.length) {
            for (let result of results) {
              fields = Object.assign(fields, result);
            }
          }
          resolve(fields);
        })
        .catch(reject);
    });
  }

  function preprocessor() {
    return pluginAction(plugin => plugin.preprocess());
  }

  function validate(data) {
    return pluginAction(plugin => plugin.validate(data));
  }

  var renderRegisterForm = function (req, res, module) {
    if (!options.publicRegistration) {
      res.sendStatus(404);
    } else {
      preprocessor()
        .then(fields => {
          res.status(200).render('register', {
            fields,
            module: module,
            errors: req.flash('error')
          });
        })
        .catch(err => res.sendStatus(404));
    }
  };

  this.authFormHandler = function (onAuthenticated, module) {
    return function (req, res) {
      if (req.isAuthenticated()) {
        res.redirect(req.session.authEntryPoint ? req.session.authEntryPoint : onAuthenticated || '/');
        return;
      }
      renderAuthForm(req, res, module);
    };
  };

  this.registerFormHandler = function (module) {
    return function (req, res) {
      if (req.isAuthenticated()) {
        delete req.session.authEntryPoint;
        req.logout();
      }
      renderRegisterForm(req, res, module);
    };
  };

  this.signInHandler = function (self, success) {
    return function (req, res, next) {
      passport.authenticate('local',
        function (err, user) {
          if (err) {
            log.error(err);
            return res.redirect(self);
          }
          if (!user) {
            console.log(req.body);
            req.flash('error', 'Не удалось выполнить вход в систему.');
            return res.redirect(self);
          }
          req.logIn(user, function (err) {
            if (err) {
              return next(err);
            }
            req.session.lastActive = new Date();
            _this.emit('login', req.body.username, req.body.password);
            var redir = req.session.authEntryPoint ?
              req.session.authEntryPoint : success || '/';
            delete req.session.authEntryPoint;
            return res.redirect(redir);
          });
        })(req, res, next);
    };
  };

  function validatePassword(body, cb) {
    if (!body.password) {
      return cb('Не передан пароль!', false);
    }

    if (body.password !== body.password2) {
      return cb('Неверно выполнен повтор пароля!', false);
    }

    if (body.password.length < passwordMinLength) {
      return cb(`Минимальная длинна пароля: ${passwordMinLength} символов`, false);
    }

    return cb(null, true);
  }

  this.registerHandler = function (self, success) {
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
          .then(output => Object.assign(user, output))
          .then(user => {
            _this.register(user, function (err) {
              if (err) {
                log.error(err);
                req.flash('error', 'Не удалось зарегистрировать пользователя!');
                return res.redirect(self);
              }
              _this.signInHandler(self, success)(req, res, next);
            });
          })
          .catch(err => {
            log.error(err);
            req.flash('error', 'Не удалось зарегистрировать пользователя!');
            return res.redirect(self);
          });
      });
    };
  };

  function active(lastActive) {
    let activeTime = moment().subtract(inactiveTimeout, 'minutes');
    if (lastActive) {
      return moment(activeTime).isBefore(lastActive);
    }
    return false;
  }

  function livePassword({pwdDate}) {
    let liveTime = moment().subtract(passwordLifetime, 'days');
    if (pwdDate) {
      return moment(liveTime).isBefore(pwdDate);
    }
    return false;
  }

  this.verifier = function (redirect, module) {
    return function (req, res, next) {
      if (req.path === '/chpwd') {
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
        req.session.authEntryPoint = req.originalUrl;
        return res.redirect(redirect || (module ? '/' + module : '') + '/auth');
      } else if (!livePassword(req.user[0])) {
        return _changePwd(req, res, `${module ? '/' + module : ''}/chpwd`);
      } else if (!active(req.session.lastActive)) {
        return _exit(req, res, redirect || (module ? '/' + module : '') + '/auth');
      } else {
        req.session.lastActive = new Date();
        _this.emit('verify', req.user[0], function () {
          _exit(req, res, redirect || (module ? '/' + module : '') + '/auth');
        });
      }
      next();
    };
  };

  function renderChangePwdForm(req, res, module) {
    res.status(200).render('changePwd', {
      module: module,
      errors: req.flash('error')
    });
  }

  this.changePwdFormHandlrer = function () {
    return function (req, res, next) {
      if (req.isAuthenticated() && !livePassword(req.user[0])) {
        renderChangePwdForm(req, res, module);
      } else {
        res.sendStatus(404);
      }
    };
  };

  this.changePwdHandlrer = function (self, success, module) {
    return function (req, res, next) {
      if (req.isAuthenticated() && !livePassword(req.user[0])) {
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
              _this.ds.update('ion_user', {id: req.user[0].id}, {pwd, pwdDate}).then(function (u) {
                _exit(req, res, (module ? '/' + module : '') + '/auth');
              }).catch(function (err) {
                req.flash('error', 'Не удалось поменять пароль!');
                return res.redirect(self);
              });
            });
          });
        });
      }
    };
  };

  this.bindAuth = function (a, module, auth, register, chpwd, success) {
    var prefix = module ? '/' : '';
    if (options.denyTopLevel) {
      a.get(prefix + module + '/' + auth, this.authFormHandler(success, module));
      a.get(prefix + module + '/sign-out', this.signOut(prefix + module + '/' + auth));
      a.get(prefix + module + '/' + register, this.registerFormHandler(module));
      a.post(prefix + module + '/' + register, this.registerHandler(prefix + module + '/' + register, success));
      a.post(prefix + module + '/' + auth, this.signInHandler(prefix + module + '/' + auth, success));
      a.use(prefix + module, this.verifier(prefix + module + '/' + auth, module));
      a.get(prefix + module + '/' + chpwd, this.changePwdFormHandlrer(prefix + module + '/' + chpwd, success));
      a.post(prefix + module + '/' + chpwd, this.changePwdHandlrer(prefix + module + '/' + chpwd, success, module));
    } else {
      a.get(prefix + module + '/sign-out', this.signOut('/' + auth));
    }
  };

  this.bindExternalAuth = function (a, nm, path, claim, success, fail) {
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
        _this.ds.fetch('ion_user', {
          filter: {
            type: {$eq: user.type},
            id: {$eq: user.id}
          }
        }).then(function (users) {
          if (users.length > 0) {
            return done(null, users[0]);
          }

          _this.ds.insert('ion_user', user).then(function (user) {
            if (user) {
              return done(null, user);
            } else {
              return done(null, false, {
                message: 'Не удалось зарегистрировать пользователя из внешней системы.'
              });
            }
          }).catch(
            function (err) {
              done(err, false);
            }
          );
        }).catch(
          function (err) {
            done(err, false, {
              message: 'Ошибка при извлечении профиля: '
            });
          }
        );
      } else {
        return done(null, false, {
          message: 'Не удалось определить идентификатор пользователя.'
        });
      }
    };
  }

  function topLevelSetup() {
    if (!options.denyTopLevel && _this.app) {
      _this.app.get('/auth', _this.authFormHandler());

      _this.app.get('/register', _this.registerFormHandler());

      _this.app.get('/sign-out', _this.signOut());

      _this.app.post('/register', _this.registerHandler('/register'));

      _this.app.post('/auth', _this.signInHandler('/auth'));

      _this.app.use('/', _this.verifier());

      _this.app.get('/chpwd', _this.changePwdFormHandlrer());

      _this.app.post('/chpwd', _this.changePwdHandlrer('/chpwd'));
    }
  }

  function passportSetup() {
    passport.use('local', new LocalStrategy({
      usernameField: 'username',
      passwordField: 'password'
    }, _this.signIn));

    if (typeof options.passports !== 'undefined') {
      for (var i = 0; i < options.passports.length; i++) {
        var pc = options.passports[i];

        if (pc && typeof pc === 'object' && pc.name && pc.module && pc.options && pc.options.mapping) {
          var nm = pc.name;
          var module = pc.module;
          var Strategy = require(module).Strategy;

          var init = pc.options.init || {};

          passport.use(nm, new Strategy(init, authHandlerConstructor(nm, pc)));

          if (!options.denyTopLevel && _this.app) {
            _this.bindExternalAuth(_this.app, nm, '', pc.options.claim);
          }
        }
      }
    }

    passport.serializeUser(function (user, done) {
      done(null, user.id + '@' + user.type);
    });

    passport.deserializeUser(function (data, done) {
      var uid = data.split('@');
      _this.ds.fetch('ion_user', {
        filter: {
          type: uid[1],
          id: uid[0]
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
    if (_this.app) {
      _this.app.use(passport.initialize());
      _this.app.use(passport.session());
      passportSetup();
    }
    return _this.ds.ensureIndex('ion_user', {type: 1, id: 1}, {unique: true});
  };

  this.setTopLevelAuth = function () {
    topLevelSetup();
  };

  /**
   * @param {{}} req
   * @returns {String}
   */
  this.getUserId = function (req) {
    var u = Array.isArray(req.user) ? req.user[0] : req.user;
    if (u) {
      return u.id + '@' + u.type;
    }
    return 'anonymous';
  };

  this.getUserData = function (req) {
    var u = Array.isArray(req.user) ? req.user[0] : req.user;
    if (u) {
      return u;
    }
    return {id: 'anonymous', type: '', name: 'Гость'};
  };

  /**
   *
   * @param {ProfilePlugin} plugin
   */
  this.injectPlugins = function (plugin) {
    if (plugin && plugin.constructor === ProfilePlugin) {
      profilePlugins.push(plugin);
    }
  };
}

util.inherits(Auth, EventEmitter);

module.exports = Auth;
