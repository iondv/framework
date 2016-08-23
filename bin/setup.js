/**
 * Created by kras on 22.08.16.
 */
var worker = require('../lib/deploy');
var config = require('../config');
var di = require('core/di');
var path = require('path');

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
    process.exit(130);
  });
}
