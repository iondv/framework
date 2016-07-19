// jscs:disable requireCapitalizedComments
/**
 * Created by kras on 20.02.16.
 */
'use strict';

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var pwdHasher = require('password-hash-and-salt');

// jshint maxstatements: 30
/**
 * @param {{dataSource: DataSource, authCallbacks: String[], passports: Object[], denyTopLevel: Boolean, app: {}}} options
 */
function Auth(options) {
  var _this = this;

  /**
   * @type {DataSource}
   */
  this.ds = options.dataSource;

  this.app = options.app;

  if (!this.ds) {
    throw new Error('Не настроен источник данных аутентификации.');
  }

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
        _this.ds.insert('ion_user', user).then(function (u) {
          callback(null, u);
        }).catch(function (err) {
          callback(err, null);
        });
      });
    } else {
      _this.ds.insert('ion_user', user).then(function (u) {
        callback(null, u);
      }).catch(function (err) {
        callback(err, null);
      });
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

  this.signOut = function (exit) {
    return function (req, res) {
      delete req.session.authEntryPoint;
      req.logout();
      res.redirect(exit || '/auth');
    };
  };

  var renderAuthForm = function (req, res, module) {
    res.status(401).render('login', {
      module: module,
      errors: req.flash('error')
    });
  };

  var renderRegisterForm = function (req, res, module) {
    res.status(200).render('register', {
      module: module,
      errors: req.flash('error')
    });
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
            console.error(err); // TODO реализовать логгирование ошибки
            req.flash('error', 'Не удалось выполнить вход в систему.');
            return res.redirect(self);
          }
          if (user) {
            req.logIn(user, function (err) {
              if (err) {
                return next(err);
              }
              // После аутентификации вызываем инжектированные колбэки
              if (options.authCallbacks) {
                for (var i = 0; i < options.authCallbacks.length; i++) {
                  var parts = options.authCallbacks[i].split('.');
                  var module = require(parts[0]);
                  if (parts.length > 1) {
                    module[parts[1]](req.body.username, req.body.password);
                  } else if (typeof module === 'function') {
                    module(req.body.username, req.body.password);
                  }
                }
              }
              return res.redirect(
                req.session.authEntryPoint ?
                  req.session.authEntryPoint :
                success || '/');
            });
          } else {
            req.flash('error', 'Не удалось выполнить вход в систему.');
            return res.redirect(self);
          }
        })(req, res, next);
    };
  };

  this.registerHandler = function (self, success) {
    return function (req, res, next) {
      if (req.body.password !== req.body.password2) {
        req.flash('error', 'Неверно выполнен повтор пароля!');
        return res.redirect(self);
      }

      _this.register({name: req.body.username, pwd: req.body.password}, function (err) {
        if (err) {
          console.error(err); // TODO Реализовать логгирование ошибки
          req.flash('error', 'Не удалось зарегистрировать пользователя!');
          return res.redirect(self);
        }
        _this.signInHandler(self, success)(req, res, next);
      });
    };
  };

  this.verifier = function (redirect) {
    return function (req, res, next) {
      if (!req.isAuthenticated()) {
        req.session.authEntryPoint = req.originalUrl;
        res.redirect(redirect || '/auth');
      } else {
        next();
      }
    };
  };

  this.bindAuth = function (a, module, auth, register, success) {
    var prefix = module ? '/' : '';
    a.get(prefix + module + '/' + auth, this.authFormHandler(success, module));
    a.get(prefix + module + '/sign-out', this.signOut(prefix + module + '/' + auth));
    a.get(prefix + module + '/' + register, this.registerFormHandler(module));
    a.post(prefix + module + '/' + register, this.registerHandler(prefix + module + '/' + register, success));
    a.post(prefix + module + '/' + auth, this.signInHandler(prefix + module + '/' + auth, success));
    a.use(prefix + module, this.verifier(prefix + module + '/' + auth));
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
    if (!options.denyTopLevel) {
      _this.app.get('/auth', _this.authFormHandler());

      _this.app.get('/register', _this.registerFormHandler());

      _this.app.get('/sign-out', _this.signOut());

      _this.app.post('/register', _this.registerHandler('/register'));

      _this.app.post('/auth', _this.signInHandler('/auth'));

      _this.app.use('/', _this.verifier);
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

          if (!options.denyTopLevel) {
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
    // Подключаем паспорт
    _this.app.use(passport.initialize());
    _this.app.use(passport.session());
    passportSetup();
    topLevelSetup();
    return _this.ds.ensureIndex('ion_user', {type: 1, id: 1}, {unique: true});
  };
}

module.exports = Auth;
