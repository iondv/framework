/**
 * Created by kras on 10.07.16.
 */
var worker = require('lib/import');
var config = require('../config');
var di = require('core/di');

var IonLogger = require('core/impl/log/IonLogger');

var sysLog = new IonLogger({});

var src = '../in';
var ns = null;

var setSrc = false;
var setNamespace = false;
var setIgnoreIntegrityCheck =  true; // Игнорирование контроля целостности. Сделано всегда по умолчанию true, так как система контролирует целостнось данных
// и атрибуты с значеиями ссылок, которые не находит в БД. А так как ссылаемые объекты могут быть импортированы позже ссылающихся.
// Соответственно сама ссылка уже будет уничтожена. Если нужно отключить можно переработать параметр ignoreIntegrityCheck
// на integrityCheck и ставить false.

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
  } else if (val === '--ignoreIntegrityCheck') {
    console.warn('При импорте игнорируется целостность данных, возможны ошибки в БД');
    setIgnoreIntegrityCheck = true;
  }
  setSrc = false;
  setNamespace = false;
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
    return worker(src, scope.dbSync, scope.metaRepo, scope.dataRepo, {namespace: ns,
      ignoreIntegrityCheck: setIgnoreIntegrityCheck});
  }
).then(function () {
  return scope.dataSources.disconnect();
}).then(
  // Справились
  function () {
    console.info('Импорт выполнен успешно.');
    process.exit(0);
  }
).catch(function (err) {
  console.error(err);
  var exit = function () { process.exit(130); };
  scope.dataSources.disconnect().then(exit).catch(exit);
});
