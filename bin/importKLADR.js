/**
 * Created by Данил on 17.02.2017.
 */

const DBF = require('stream-dbf');
const config = require('../config');
const di = require('core/di');
const IonLogger = require('core/impl/log/IonLogger');

var sysLog = new IonLogger({});
var scope = null;
var filePath = null;
var packageSize = 1000;
var filter = null;

for (var i = 0; i < process.argv.length; i++) {
  if (process.argv[i] === '--path') {
    filePath = process.argv[i + 1];
  } else if (process.argv[i] === '--packageSize') {
    packageSize = process.argv[i + 1];
  } else if (process.argv[i] === '--filter') {
    filter = process.argv[i + 1];
  }
}

di('app', config.di,
  {
    sysLog: sysLog
  },
  null,
  ['auth', 'rtEvents', 'sessionHandler']
).then(function (s) {
  return new Promise(function (resolve, reject) {
    scope = s;
    var parser = new DBF(filePath);
    var stream = parser.stream;
    var records = [];

    stream.on('data', function (record) {
      if (record && filtration(record, filter)) {
        records.push(record);
      }
    });
    stream.on('end', function () {
      resolve(records);
    });
  });
}).then(function (records) {

  var containers = [];

  function processingRecords(records, dataRepo, start, length) {
    var promises = [];
    var end = start + length <= records.length - 1 ? start + length : records.length - 1;
    records.slice(start, end).forEach(function (item, i, arr) {
      var className = getRecordClass(item);
      promises.push(dataRepo.getItem(className, getInternalCode(item)).then(function (result) {
        var updates = getUpdates(item, result, containers);
        if (result) {
          return dataRepo.editItem(className, result.getItemId(), updates);
        } else {
          return dataRepo.createItem(className, updates);
        }
      }));
    });
    return Promise.all(promises).then(function () {
      if (end < records.length - 1) {
        return processingRecords(records, dataRepo, end, length);
      } else {
        return containers;
      }
    });
  }
  return processingRecords(records, scope.dataRepo, 0, packageSize);

}).then(function (containers) {

  // TODO: Возможно здесь следует сделать также пакетную обработку
  var filteredContainers = {};
  var promises = [];
  containers.forEach(function (item, i, arr) {
    if (Array.isArray(item.refs) && item.refs.length > 0) {
      promises.push(scope.dataRepo.getItem(item.className, item.internalCode).then(function (result) {
        if (result) {
          for (var i = 0; i < item.refs; i++) {
            filteredContainers[item.refs[i]] = item.internalCode;
          }
        } else {
          // TODO: Тут надо бы наверно как то сообщать об отсутствии контейнера
        }
      }));
    }
  });
  Promise.all(promises).then(function (results) {return filteredContainers;});

}).then(function (references) {

  // TODO: Установка контейнеров
  // TODO: Тоже пакетами
  console.log(references);

}).then(function () {

  return scope.dataSources.disconnect();

}).then(

  function () {
    console.log('Импорт справочника адресов успешно завершен.');
    process.exit(0);
  }

).catch(function (err) {
  console.error(err);
  var exit = function () { process.exit(130); };
  scope.dataSources.disconnect().then(exit).catch(exit);
});

var classNames = {
  STREET: 'STREET',
  PLACE: 'PLACE',
  CITY: 'CITY',
  AREA: 'AREA',
  REGION: 'REGION'
};

function isFIAS(record) {
  return record.hasOwnProperty('NORMDOC');
}

function getRecordClass(record) {
  if (isFIAS(record)) {
    if (record.STREETCODE && record.STREETCODE !== '0000') {
      return classNames.STREET;
    } else if (record.PLANCODE && record.PLANCODE !== '0000') {
      return null;
    } else if (record.PLACECODE && record.PLACECODE !== '000') {
      return classNames.PLACE;
    } else if (record.CTARCODE && record.CTARCODE !== '000') {
      return null;
    } else if (record.CITYCODE && record.CITYCODE !== '000') {
      return classNames.CITY;
    } else if (record.AREACODE && record.AREACODE !== '000') {
      return classNames.AREA;
    } else if (record.AUTOCODE && record.AUTOCODE !== '000') {
      return null;
    } else if (record.REGIONCODE && record.REGIONCODE !== '00') {
      return classNames.REGION;
    }
  } else {
    if (record.CODE.length === 13) {
      if (record.CODE.search(/^\d{2}0{9}\d{2}$/) > -1) {
        return classNames.REGION;
      } else if (record.CODE.search(/^\d{5}0{6}\d{2}$/) > -1) {
        return classNames.AREA;
      } else if (record.CODE.search(/^\d{8}0{3}\d{2}$/) > -1) {
        return classNames.CITY;
      } else if (record.CODE.search(/^\d{11}\d{2}$/) > -1) {
        return classNames.PLACE;
      }
    } else if (record.CODE.length === 17) {
      return classNames.STREET;
    }
  }
  return null;
}

function filtration(record, filter) {
  // TODO: Пользоывательский фильтр, отброс неактуальных, отброс неформатных
  return false;
}

function getInternalCode(record) {
  switch (getRecordClass(record)) {
    case classNames.STREET: {
      return record.CODE.substring(0, 15);
    } break;
    case classNames.PLACE:
    case classNames.CITY:
    case classNames.AREA:
    case classNames.REGION: {
      return record.CODE.substring(0, 11);
    } break;
  }
  return null;
}

function getUpdates(record, item, containers) {
  // TODO: кодировки
  // TODO: в containers добавляется объект формата {containerClassName, containerInternalCode, refs}
  // TODO: в updates попадают только изменённые поля, если нет обновлений - вернуть null
  var updates = null;
  var fias = isFIAS(record);
  if (!item) {
    updates.CODE = getInternalCode(record);
  }
  var name = fias ? record.OFFNAME : record.NAME;
  if (item.base.NAME !== name) {
    updates.NAME = name;
  }
  /*
  CODE
  NAME
  SOCR
  INDEX
  GNINMB
  UNO
  OCATD
  */
  return updates;
}
