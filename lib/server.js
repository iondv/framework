/**
 * Created by krasilneg on 22.08.18.
 */
/* eslint no-process-exit:off, no-sync:off */
'use strict';

const path = require('path');
const http = require('http');
const https = require('https');
const express = require('express');
const ejsLocals = require('ejs-locals');
const flash = require('connect-flash');
const fs = require('fs');

const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const FileStreamRotator = require('file-stream-rotator');
const morgan = require('morgan');
const di = require('core/di');
const theme = require('lib/util/theme');

const SettingsRepository = require('core/interfaces/SettingsRepository');

const errorSetup = require('core/error-setup');
const alias = require('core/scope-alias');
const extend = require('extend');

module.exports = (env) => {
  let {config, sysLog, onScope, onStart} = env;
  errorSetup(config.lang || 'ru');

  /** Server http'
   NODE_PATH must contain the path to the system directory to run
   */

  sysLog.info('IONDV application launch');

  var app = express();

  global.app = app;

// TODO Access-log must be implemented through IonLogger
  if (process.env.NODE_ENV !== 'development') {
    var logDirectory = path.join(__dirname, '../log');
    if (!fs.existsSync(logDirectory)) {
      fs.mkdirSync(logDirectory);
    }
    var accessLogStream = FileStreamRotator.getStream({
      filename: path.join(logDirectory, '/access-%DATE%.log'),
      frequency: 'daily',
      verbose: false,
      date_format: 'YYYY-MM-DD'
    });
    app.use(morgan('combined', {stream: accessLogStream}));
  } else {
    app.use(morgan('dev'));
  }

// Middleware of save messages in session before redirect
  app.use(flash());

// Templates

  app.engine('ejs', ejsLocals);
  app.set('view engine', 'ejs');

// Support of put and deletes
// override with different headers; last one takes precedence
  app.use(methodOverride('X-HTTP-Method'));       // Microsoft
  app.use(methodOverride('X-HTTP-Method-Override')); // Google/GData
  app.use(methodOverride('X-Method-Override'));      // IBM

  var limit = config.requestSizeLimit || '1mb';
  app.use(bodyParser.text({type: 'text/*', limit: limit}));
  app.use(bodyParser.json({type: 'application/json', limit: limit}));
  app.use(bodyParser.urlencoded({extended: true, limit: limit}));
  app.use(bodyParser.raw({limit: limit}));

  app.locals.baseUrl = config.baseUrl || '/';
  if (!app.locals.baseUrl.endsWith('/')) {
    app.locals.baseUrl = app.locals.baseUrl + '/';
  }

// Create HTTP server.
  var server = config.https ? https.createServer(config.https, app) : http.createServer(app);

// jshint maxstatements: 60, maxcomplexity: 60

  function onError(error) {
    sysLog.error(error);
    server.close(() => {
      process.exit(130);
    });
  }

  function start(ports, i) {
    return new Promise((resolve, reject) => {
      server.once('error', function (err) {
        if (err.code !== 'EADDRINUSE') {
          return reject(err);
        }
        sysLog.info('Could not connect to port ' + ports[i]);
        start(ports, i + 1).then(resolve).catch(reject);
      });
      if (i < ports.length) {
        server.listen(ports[i], resolve);
      } else {
        reject(new Error('Could not start server. All specified ports are occupied'));
      }
    });
  }

  function moduleLoader(name, module) {
    return function () {
      sysLog.info('Loading a module.' + name);
      return module._init().then(() => {
        sysLog.info('Module ' + name + ' is loaded.');
      });
    };
  }

// Link the application
  return di('boot', config.bootstrap,
    {
      server: server,
      application: app,
      sysLog: sysLog
    })
    .then(scope => di('app', extend(true, config.di, scope.settings.get('plugins') || {}), {}, 'boot'))
    .then(scope => alias(scope, scope.settings.get('di-alias')))
    .then((scope) => {
      if (typeof onScope === 'function') {
        onScope(scope);
      }
      return scope;
    })
    .then((scope) => {
      let moduleTitles = {};
      try {
        // Theme for the authentication and registration pages
        theme(
          app, '',
          path.normalize(path.join(__dirname, '..')),
          scope.settings.get('theme') || config.theme || 'default', sysLog
        );

        // Redirect to default module
        let defaultModule = null;
        if (scope.settings && scope.settings instanceof SettingsRepository) {
          defaultModule = scope.settings.get('defaultModule');
          moduleTitles = scope.settings.get('moduleTitles') || {};
        }

        if (!defaultModule && config.defaultModule) {
          defaultModule = config.defaultModule;
        }

        if (!defaultModule) {
          throw new Error('No default module specified!');
        }

        app.locals.defaultModule = defaultModule;
        app.locals.pageTitle = scope.settings.get('pageTitle') || 'IONDV. Framework';

        app.get('/', (req, res) => {
          res.redirect(app.locals.baseUrl + defaultModule);
        });

        scope.auth.setTopLevelAuth();

        if (scope.oauth) {
          app.use('/oauth2/grant', scope.oauth.grant());
          app.post('/oauth2/token', scope.oauth.token());
        }

      } catch (err) {
        return Promise.reject(err);
      }

      sysLog.info('Loading web modules.');
      let sysMenu = [];
      let moduleInitiators = null;
      try {
        let candidates = fs.readdirSync(path.join(__dirname, '../modules'));
        let skipModules = config.skipModules || [];
        for (let i = 0; i < candidates.length; i++) {
          if (
            fs.existsSync(path.join(__dirname, '../modules', candidates[i], 'web.js')) &&
            skipModules.indexOf(candidates[i]) < 0
          ) {
            let module = require('modules/' + candidates[i] + '/web');
            if (typeof module === 'function') {
              let title = moduleTitles.hasOwnProperty(candidates[i]) ? moduleTitles[candidates[i]] : module.locals.sysTitle;
              if (title) {
                sysMenu.push(
                  {
                    name: candidates[i],
                    description: title.description || title,
                    order: title.order || 0
                  }
                );
                module.locals.sysTitle = title;
              }
              module.locals.sysMenu = sysMenu;
              module.locals.baseUrl = config.baseUrl || '/';
              app.use(module);
              if (typeof module._init === 'function') {
                if (moduleInitiators) {
                  moduleInitiators = moduleInitiators.then(moduleLoader(candidates[i], module));
                } else {
                  moduleInitiators = moduleLoader(candidates[i], module)();
                }
              }
            } else {
              sysLog.warn('Module ' + candidates[i] + ' is not an express application.');
            }
          }
        }
        for (let ref in moduleTitles) {
          if (moduleTitles.hasOwnProperty(ref) && moduleTitles[ref] && moduleTitles[ref].url) {
            sysMenu.push(
              {
                name: moduleTitles[ref].url,
                description: moduleTitles[ref].title || ref,
                external: true,
                order: moduleTitles[ref].order || 0
              }
            );
          }
        }
        sysMenu.sort((a, b) => a.order - b.order);
      } catch (err) {
        return Promise.reject(err);
      }
      if (moduleInitiators) {
        return moduleInitiators.then(() => {
          sysLog.info('All modules are loaded.');
          return scope;
        });
      }
    })
    .then(
      // Run the application
      (scope) => {
        let ports = config.port;
        if (ports && !Array.isArray(ports)) {
          ports = [ports];
        }
        if (ports.length === 0) {
          ports.push(config.https ? 443 : 80);
        }
        return start(ports, 0).then(() => scope);
      }
    )
    .then(
      (scope) => {
        server.on('error', onError);
        sysLog.info('Listen to ' + (typeof server.address() === 'string' ?
          'conveyor ' + server.address() :
          'port ' + server.address().port));
        return scope;
      })
    .then((scope) => {
      if (typeof onStart === 'function') {
        onStart(scope);
      }
      process.on('SIGTERM', () => {
        server.close();
      });
    })
    .catch(onError);
};
