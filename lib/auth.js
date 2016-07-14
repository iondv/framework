// jscs:disable requireCapitalizedComments
/**
 * Created by kras on 20.02.16.
 */
'use strict';

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var pwdHasher = require('password-hash-and-salt');

/**
 * @type {DataSource}
 */
var authDatasource = null;

/**
 * @type {{DataSource: DataSource, localAuthDs: String, authCallbacks: String[], passports: Object[], denyTopLevel: Boolean}}
 */
var config = {};

// API
/**
 * Метод получения учетной записи текущего пользователя
 * @param {String} id
 * @param {Function} callback
 */
module.exports.userProfile = function (id, callback) {
  if (!authDatasource) {
    throw 'Не настроен источник данных аутентификации.';
  }

  var uid = id.split('@');

  authDatasource.fetch('ion_user', {
    filter: {
      type: uid[1],
      id: uid[0]
    }
  }).then(callback);
};

var Register = module.exports.register = function (user, callback) {
  if (!authDatasource) {
    throw new Error('Не настроен источник данных аутентификации.');
  }

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
      authDatasource.insert('ion_user', user).then(function (u) {
        callback(null, u);
      }).catch(function (err) {
        callback(err, null);
      });
    });
  } else {
    authDatasource.insert('ion_user', user).then(function (u) {
      callback(null, u);
    }).catch(function (err) {
      callback(err, null);
    });
  }
};

var SignIn = module.exports.signIn = function (username, password, done) {
  var checker = pwdHasher(password);
  authDatasource.fetch('ion_user',
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

function SignOut(exit) {
  return function (req, res) {
    delete req.session.authEntryPoint;
    req.logout();
    res.redirect(exit || '/auth');
  };
}

// Типовые хендлеры

var renderAuthForm = function (req, res) {
  res.status(401).render('login', {
    errors: req.flash('error')
  });
};

var renderRegisterForm = function (req, res) {
  res.status(200).render('register', {
    errors: req.flash('error')
  });
};

var AuthForm = module.exports.authFormHandler = function (onAuthenticated) {
  return function (req, res) {
    if (req.isAuthenticated()) {
      res.redirect(req.session.authEntryPoint ? req.session.authEntryPoint : onAuthenticated || '/');
      return;
    }
    renderAuthForm(req, res);
  };
};

var RegisterForm = module.exports.registerFormHandler = function () {
  return function (req, res) {
    if (req.isAuthenticated()) {
      delete req.session.authEntryPoint;
      req.logout();
    }
    renderRegisterForm(req, res);
  };
};

var SignInHandler = module.exports.signInHandler = function (self, success) {
  return function (req, res, next) {
    passport.authenticate('local',
      function (err, user, info) {
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
            if (config.authCallbacks) {
              for (var i = 0; i < config.authCallbacks.length; i++) {
                var parts = config.authCallbacks[i].split('.');
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

var RegisterHandler = module.exports.registerHandler = function (self, success) {
  return function (req, res, next) {
    if (req.body.password !== req.body.password2) {
      req.flash('error', 'Неверно выполнен повтор пароля!');
      return res.redirect(self);
    }

    Register({name: req.body.username, pwd: req.body.password}, function (err, user) {
      if (err) {
        console.error(err); // TODO Реализовать логгирование ошибки
        req.flash('error', 'Не удалось зарегистрировать пользователя!');
        return res.redirect(self);
      }
      SignInHandler(self, success)(req, res, next);
    });
  };
};

var Verifier = module.exports.verifier = function (redirect) {
  return function (req, res, next) {
    if (!req.isAuthenticated()) {
      req.session.authEntryPoint = req.originalUrl;
      res.redirect(redirect || '/auth');
    } else {
      next();
    }
  };
};

module.exports.bindAuth = function (a, root, auth, register, success) {
  a.get(root + '/' + auth, AuthForm(success));
  a.get(root + '/sign-out', SignOut(root + '/' + auth));
  a.get(root + '/' + register, RegisterForm());
  a.post(root + '/' + register, RegisterHandler(root + '/' + register, success));
  a.post(root + '/' + auth, SignInHandler(root + '/' + auth, success));
  a.use(root, Verifier(root + '/' + auth));
};

var ExtAuth = module.exports.bindExternalAuth = function (a, nm, path, claim, success, fail) {
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
      authDatasource.fetch('ion_user', {
        filter: {
          type: {$eq: user.type},
          id: {$eq: user.id}
        }
      }).then(function (users) {
        if (users.length > 0) {
          return done(null, users[0]);
        }

        authDatasource.insert('ion_user', user).then(function (user) {
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

function topLevelSetup(app) {
  if (!config.denyTopLevel) {
    app.get('/auth', AuthForm());

    app.get('/register', RegisterForm());

    app.get('/sign-out', SignOut());

    app.post('/register', RegisterHandler('/register'));

    app.post('/auth', SignInHandler('/auth'));

    app.use('/', Verifier());
  }
}

function passportSetup(app) {
  passport.use('local', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
  }, SignIn));

  if (typeof config.passports !== 'undefined') {
    for (var i = 0; i < config.passports.length; i++) {
      var pc = config.passports[i];

      if (pc && typeof pc === 'object' && pc.name && pc.module && pc.options && pc.options.mapping) {
        var nm = pc.name;
        var module = pc.module;
        var Strategy = require(module).Strategy;

        var init = pc.options.init || {};

        passport.use(nm, new Strategy(init, authHandlerConstructor(nm, pc)));

        if (!config.denyTopLevel) {
          ExtAuth(app, nm, '', pc.options.claim);
        }
      }
    }
  }

  passport.serializeUser(function (user, done) {
    done(null, user.id + '@' + user.type);
  });

  passport.deserializeUser(function (data, done) {
    var uid = data.split('@');
    authDatasource.fetch('ion_user', {
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

// Инициализация

/**
 * @param {{}} app
 * @param {{DataSource: DataSource, localAuthDs: String, authCallbacks: String[], passports: Object[], denyTopLevel: Boolean}} conf
 */
module.exports.init = function (app, conf) {
  config = conf;
  authDatasource = config.DataSource;
  if (!authDatasource) {
    authDatasource = global.ionDataSources.get(config.localAuthDS);
  }

  if (!authDatasource) {
    throw 'Не указан источник данных локальной аутентификации!';
  }

  // Подключаем паспорт
  app.use(passport.initialize());
  app.use(passport.session());
  passportSetup(app);

  topLevelSetup(app, config);
};
