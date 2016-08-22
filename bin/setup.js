/**
 * Created by kras on 22.08.16.
 */
var worker = require('../lib/deploy');
var config = require('../config');
var di = require('core/di');

var IonLogger = require('core/impl/log/IonLogger');

var sysLog = new IonLogger({});

var setSrc = false;

var src = '';

process.argv.forEach(function (val) {
  if (val === '--src') {
    setSrc = true;
    return;
  } else if (setSrc) {
    src = val;
  }
  setSrc = false;
});

var scope = null;
// Связываем приложение
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
    return worker(src);
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
