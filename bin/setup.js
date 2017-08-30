/**
 * Created by kras on 22.08.16.
 */
const worker = require('../lib/deploy');
const config = require('../config');
const di = require('core/di');
const path = require('path');
const errorSetup = require('core/error-setup');
const alias = require('core/scope-alias');
const extend = require('extend');
errorSetup(config.lang || 'ru');

var IonLogger = require('core/impl/log/IonLogger');

var sysLog = new IonLogger({});

if (process.argv.length > 2) {
  var app = process.argv[2];

  di('boot', config.bootstrap,
    {
      sysLog: sysLog
    }, null, ['auth', 'rtEvents', 'sessionHandler'])
    .then((scope) => di('app', extend(true, config.di, scope.settings.get('plugins') || {}), {}, 'boot'))
    .then((scope) => alias(scope, scope.settings.get('di-alias')))
    .then((scope) => worker(path.join(__dirname, '..', 'applications', app)).then(() => scope))
    .then((scope) => scope.dataSources.disconnect())
    .then(() => {
      console.info('Настройка выполнена успешно.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(130);
    });
}
