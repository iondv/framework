/**
 * Created by kras on 20.02.16.
 */
'use strict';

var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var pwdHasher = require('password-hash-and-salt');
var express = require('express');
var join = require('path').join;

var renderAuthForm = function (module, req, res) {
  var loginTemplate = 'auth';
  // var moduleName = req.baseUrl.substr(1); //
  if (module && req.app.locals.ionModules &&
    req.app.locals.ionModules[module] &&
    req.app.locals.ionModules[module].authorization &&
    req.app.locals.ionModules[module].authorization.loginFormTemplatePath) {
    loginTemplate = join(module, req.app.locals.ionModules[module].authorization.loginFormTemplatePath);
  }
  res.status(401);
  res.render(loginTemplate, {
    error: req.flash('error')
  });
};

/**
 * @type {DataSource}
 */
var authDatasource = null;


function initDataSource(config){
  authDatasource = config.DataSource;
  if (!authDatasource) {
    authDatasource = global.ionDataSources.get(config.localAuthDS);
  }

  if (!authDatasource) {
    throw 'Не указан источник данных локальной аутентификации!';
  }
}

module.exports.initDataSource = initDataSource;

/**
 * @param {{ successRedirect: string, DataSource: DataSource, localAuthDs: string, authCallbacks: string[], passports: object[] }} config
 * @returns {Function}
 */
module.exports.init = function(config){
  return function(app) {
    return new global.Promise(function (resolve, reject) {
      try {
        // Подключаем паспорт
        app.use(passport.initialize());
        app.use(passport.session());

        var localAuth = {
          successRedirect: config.successRedirect ? config.successRedirect : '/',
          failureRedirect: '/auth'
        };

        initDataSource(config);

        var router = express.Router();

        passport.use('local', new localStrategy({
            usernameField: 'username',
            passwordField: 'password'
          },
          function (username, password, done) {
            var checker = pwdHasher(password);
            authDatasource.fetch('ion_user',
              {
                filter: {
                  type: 'local',
                  id: username,
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
              }).catch(function(err){
                done(err, false);
              });
          }
        ));

        router.get('/auth', function (req, res) {
          if (req.isAuthenticated()) {
            res.redirect(req.session.authEntryPoint?req.session.authEntryPoint:localAuth.successRedirect);
            return;
          } else {
            renderAuthForm(req.session.authModule?req.session.authModule:'', req, res);
          }
        });

        router.get('/sign-out', function (req, res) {
          delete req.session.authEntryPoint;
          req.logout();
          res.redirect('/');
        });

        router.post('/auth',function(req, res, next) {
            passport.authenticate('local',
              function (err, user, info) {
                if (err) {
                  return next(err);
                }
                if (user) {
                  req.logIn(user, function(err) {
                    if (err) { return next(err); }
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
                    return res.redirect(req.session.authEntryPoint ? req.session.authEntryPoint : localAuth.successRedirect);
                  });
                } else {
                  //  failureFlash: true,
                  res.redirect(localAuth.failureRedirect);
                }
              })(req,res,next);
          }
        );

        if (typeof config.passports !== 'undefined') {
          for (var i = 0; i < config.passports.length; i++) {
            var pc = config.passports[i];

            if (pc && typeof pc === "object" && pc.name && pc.module && pc.options && pc.options.mapping) {
              var nm = pc.name;
              var module = pc.module;
              var strategy = require(nm).Strategy;

              var init = pc.options.init || {};
              init.callbackURL = '/auth/' + nm + '/callback';

              passport.use(nm, new strategy(init,
                function (accessToken, refreshToken, profile, done) {
                  var user = {};

                  user.type = nm;

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
                        function(err) {
                          done(err, false);
                        }
                      );
                    }).catch(
                      function(err) {
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
                }));

              router.get('/auth/' + nm, passport.authenticate(nm, pc.options.claim));
              router.get(init.callbackURL,
                passport.authenticate(nm,
                  {
                    failureRedirect: localAuth.failureRedirect
                  }),
                  function (req, res) {
                    res.redirect(req.session.authEntryPoint?req.session.authEntryPoint:localAuth.successRedirect);
                  }
              );
            }
          }
        }

        passport.serializeUser(function (user, done) {
          done(null, user.id + '@' + user.type);
        });

        passport.deserializeUser(function (data, done) {
          var u_id = data.split('@');
          authDatasource.fetch('ion_user', {
            filter: {
              type: u_id[1],
              id: u_id[0]
            }
          }).then(function (user) {
            done(null, user);
          }).catch(
            function(err){
              done(err,null);
            }
          );
        });

        app.use(router);
        resolve(app);
      } catch (e) {
        reject(e);
      }
    });
  };
};

module.exports.verify = function(name){
  return function(req, res, next){
    if (!req.isAuthenticated()) {
      req.session.authEntryPoint = req.originalUrl;
      req.session.authModule = name;
      renderAuthForm (name, req, res);
    } else {
      next();
    }
  };
};

module.exports.userProfile = function(id, callback){
  if (!authDatasource) {
    throw 'Не настроен источник данных аутентификации.';
  }

  var u_id = id.split('@');

  authDatasource.fetch('ion_user',{filter:{
    type: u_id[1],
    id: u_id[0]
  }}).then(callback);
};

module.exports.register = function(user, callback){
  if (!authDatasource) {
    throw 'Не настроен источник данных аутентификации.';
  }

  user.type = "local";

  if (!user.name) {
    user.name = user.email;
  }

  if (!user.id) {
    user.id = user.name;
  }

  if (user.pwd) {
    var hasher = pwdHasher(user.pwd);
    hasher.hash(function(err, hash){
      user.pwd = hash;
      authDatasource.insert('ion_user',user).then(function(u){
        callback(null,u);
      }).catch(function(err){
        callback(err,null);
      });
    });
  } else {
    authDatasource.insert('ion_user', user).then(function(u){
      callback(null,u);
    }).catch(function(err){
      callback(err,null);
    });
  }
};
