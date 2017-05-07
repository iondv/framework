/**
 * Created by kras on 22.08.16.
 */
const worker = require('../lib/deploy');
const config = require('../config');
const di = require('core/di');
const path = require('path');
const errorSetup = require('core/error-setup');
errorSetup(config.lang || 'ru');

var IonLogger = require('core/impl/log/IonLogger');

var sysLog = new IonLogger({});

if (process.argv.length > 2) {
  var app = process.argv[2];
  var scope = null;

  di('app', config.di,
    {
      sysLog: sysLog
    },
    null,
    ['auth', 'rtEvents', 'sessionHandler']
  ).then(
    // Импорт
    function (scp) {
      scope = scp;
      return worker(path.join(__dirname, '..', 'applications', app));
    }
  ).then(function () {
    return scope.dataSources.disconnect();
  }).then(
    // Справились
    function () {
      console.info('Настройка выполнена успешно.');
      process.exit(0);
    }
  ).catch(function (err) {
    console.error(err);
    var exit = function () { process.exit(130); };
    scope.dataSources.disconnect().then(exit).catch(exit);
  });
}
