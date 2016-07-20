/**
 * Created by kras on 10.07.16.
 */
var worker = require('lib/import');
var config = require('../config');
var di = require('core/di');

var IonLogger = require('core/impl/log/IonLogger');

var sysLog = new IonLogger({});

var src = '../in';
var ns = '';

var setSrc = false;
var setNamespace = false;

process.argv.forEach(function (val) {
  if (val === '--src') {
    setSrc = true;
    setNamespace = false;
    return;
  } else if (val === '--ns') {
    setNamespace = true;
    setSrc = false;
    return;
  } else if (setSrc) {
    src = val;
  } else if (setNamespace) {
    ns = val;
  }
  setSrc = false;
  setNamespace = false;
});

// Связываем приложение
di('app', config.di,
  {
    sysLog: sysLog
  }).
then(
  // Импорт
  function (scope) {
    return worker(src, scope.dbSync, scope.metaRepo, scope.dataRepo, {namespace: ns});
  }
).then(
  // Справились
  function () {
    console.info('Импорт выполнен успешно.');
    process.exit(0);
  }
).catch(function (err) {
  console.error(err);
  process.exit(130);
});
