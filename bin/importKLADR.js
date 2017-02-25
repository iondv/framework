/**
 * Created by Данил on 17.02.2017.
 */

/* jshint maxstatements: 100, maxcomplexity: 100*/

const DBF = require('stream-dbf');
const config = require('../config');
const di = require('core/di');
const IonLogger = require('core/impl/log/IonLogger');
const encoding = require('encoding');

const classNames = {
  STREET: 'STREET',
  PLACE: 'PLACE',
  CITY: 'CITY',
  AREA: 'AREA',
  REGION: 'REGION',
  KLADR: 'KLADR'
};

var sysLog = new IonLogger({});
var scope = null;
var filePath = null;
var packageSize = 1000;
var filter = null;
var filterBy = null;
var charset = 'utf8';

for (var i = 0; i < process.argv.length; i++) {
  if (process.argv[i] === '--path') {
    filePath = process.argv[i + 1];
  } else if (process.argv[i] === '--packageSize') {
    packageSize = parseInt(process.argv[i + 1]);
  } else if (process.argv[i] === '--filter') {
    filter = process.argv[i + 1];
  } else if (process.argv[i] === '--filterBy') {
    filterBy = process.argv[i + 1];
  } else if (process.argv[i] === '--charset') {
    charset = process.argv[i + 1];
  }
}

di('app', config.di,
  {
    sysLog: sysLog
  },
  null,
  ['auth', 'rtEvents', 'sessionHandler']
).then(function (s) {

  return new Promise(function (resolve) {
    scope = s;
    var parser = new DBF(filePath);
    var stream = parser.stream;
    var records = [];

    stream.on('data', function (record) {
      if (record && filtration(record)) {
        records.push(record);
      }
    });
    stream.on('end', function () {
      console.log(records.length + ' записей готовы к импорту.');
      resolve(records);
    });
  });

}).then(function (records) {

  var containers = [];
  var created = 0;
  var edited = 0;
  return packageSequence(records, 0, function (record) {
    var className = getRecordClass(record);
    return scope.dataRepo.getItem(className, getInternalCode(record)).then(function (result) {
      var updates = getUpdates(record, result, containers);
      if (result) {
        return scope.dataRepo.editItem(className, result.get('CODE'), updates).then(function () { edited++; });
      } else {
        return scope.dataRepo.createItem(className, updates).then(function () { created++; });
      }
    });
  }).then(function () {
    console.log(created + ' записей добавлено.');
    console.log(edited + ' записей обновлено.');
    return containers;
  });

}).then(function (containers) {

  var references = [];
  var checked = 0;
  return packageSequence(containers.keys, 0, function (container) {
    if (Array.isArray(containers[container]) && containers[container] > 0) {
      return scope.dataRepo.getItem(classNames.KLADR, container).then(function (result) {
        if (result) {
          for (var i = 0; i < containers[container].length; i++) {
            references.push({container: container, record: containers[container][i]});
          }
        } else {
          console.error('Контейнер ' + container + ' не обнаружен.');
        }
        checked++;
      });
    }
  }).then(function () {
    console.log(checked + ' контейнеров проверено.');
    return references;
  });

}).then(function (references) {

  var conts = 0;
  return packageSequence(references, 0, function (item) {
    return scope.dataRepo.editItem(getRecordClass(item.record), getInternalCode(item.record), {
      CONTAINER: item.container
    }).then(function () {
      conts++;
    });
  }).then(function () {
    console.log(conts + ' ссылок на контейнер установлено.');
  });
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

function packageSequence(array, start, body) {
  var promises = [];
  var end = start + packageSize <= array.length - 1 ? start + packageSize : array.length - 1;
  array.slice(start, end).forEach(function (item, i) {
    var p = body.call(this, item, i);
    if (p) {
      promises.push(p);
    }
  });
  return Promise.all(promises).then(function () {
    if (end < array.length - 1) {
      return packageSequence(array, end, body);
    } else {
      return null;
    }
  });
}

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

function filtration(record) {
  if (filterBy && filter && record[filter].search(new RegExp(filterBy)) > -1) {
    var className = getRecordClass(record);
    if (className) {
      if (isFIAS(record)) {
        return record.ACTSTATUS === '1';
      } else {
        if (className === classNames.STREET) {
          return record.CODE.search(/^\d{15}00$/) > -1;
        } else {
          return record.CODE.search(/^\d{11}00$/) > -1;
        }
      }
    }
  }
  return false;
}

function getInternalCode(record) {
  switch (getRecordClass(record)) {
    case classNames.STREET: {
      return record.CODE.trim().substring(0, 15);
    } break;
    case classNames.PLACE:
    case classNames.CITY:
    case classNames.AREA:
    case classNames.REGION: {
      return record.CODE.trim().substring(0, 11);
    } break;
  }
  return null;
}

function getUpdates(record, item, containers) {
  var updates = {};
  if (isFIAS(record)) {
    updates.NAME = convertCharset(record.FORMALNAME);
    updates.SOCR = convertCharset(record.SHORTNAME);
    updates.INDEX = record.POSTALCODE.trim();
    updates.GNINMB = record.IFNSUL.trim().length > 0 ? record.IFNSUL.trim() : record.IFNSFL.trim();
    updates.UNO = record.TERRIFNSUL.trim().length > 0 ? record.TERRIFNSUL.trim() : record.TERRIFNSFL.trim();
    updates.OCATD = record.OKATO.trim();
  } else {
    updates.NAME = convertCharset(record.NAME);
    updates.SOCR = convertCharset(record.SOCR);
    updates.INDEX = record.INDEX.trim();
    updates.GNINMB = record.GNINMB.trim();
    updates.UNO = record.UNO.trim();
    updates.OCATD = record.OCATD.trim();
  }

  var code = getInternalCode(record);
  var container = null;
  switch (getRecordClass(record)) {
    case classNames.STREET: {container = code.substring(0, 11);} break;
    case classNames.PLACE: {container = code.replace(/^(\d{8})\d{3}$/, '$1000');} break;
    case classNames.CITY: {container = code.replace(/^(\d{5})\d{6}$/, '$1000000');} break;
    case classNames.AREA: {container = code.replace(/^(\d{2})\d{9}$/, '$1000000000');} break;
    case classNames.REGION: {container = null;} break;
  }
  if (container && container.search(/[\d^0]/) > -1 && (!item || item.get('CONTAINER') !== container)) {
    if (!Array.isArray(containers[container])) {
      containers[container] = [];
    }
    containers[container].push(record);
  }

  if (item) {
    for (var attr in updates) {
      if (updates.hasOwnProperty(attr) && item.get(attr) === updates[attr]) {
        delete updates[attr];
      }
    }
  } else {
    updates.CODE = code;
  }
  if (Object.keys(updates).length) {
    return updates;
  } else {
    return null;
  }
}

function convertCharset(text) {
  return encoding.convert(text, charset, '').toString(charset);
}
