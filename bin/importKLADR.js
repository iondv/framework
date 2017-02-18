/**
 * Created by Данил on 17.02.2017.
 */

var Parser = require('node-dbf');
var config = require('../config');
var di = require('core/di');

var IonLogger = require('core/impl/log/IonLogger');

var sysLog = new IonLogger({});

function isFIAS(record) {
  return false;
}

var filePath = null;

for (var i = 0; i < process.argv.length; i++) {
  if (process.argv[i] === '--path') {
    filePath = process.argv[i + 1];
  }
}

var scope = null;
di('app', config.di,
  {
    sysLog: sysLog
  },
  null,
  ['auth', 'rtEvents', 'sessionHandler']
).then(function (s) {
  return new Promise(function (resolve, reject) {
    scope = s;
    var parser = new Parser(filePath, {encoding: 'utf-8'});

    parser.on('record', function (record) {
      //TODO: Здесь парсим и сохраняем запись
      console.log(record.CODE);
      if (isFIAS(record)) {
        //TODO: Парсинг из ФИАСа
      } else {
        //TODO: Из КЛАДРа
      }
    });

    parser.on('end', function (p) {
      resolve();
    });
    parser.parse();
  });
}).then(function () {
  return scope.dataSources.disconnect();
}).then(
  function () {
    console.log("Импорт справочника адресов успешно завершен.");
    process.exit(0);
  }
).catch(function (err) {
  console.error(err);
  var exit = function () { process.exit(130); };
  scope.dataSources.disconnect().then(exit).catch(exit);
});

