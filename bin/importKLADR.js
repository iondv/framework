/**
 * Created by Данил on 17.02.2017.
 */

/* jshint maxstatements: 100, maxcomplexity: 100*/

const DBF = require('stream-dbf');
const config = require('../config');
const di = require('core/di');
const IonLogger = require('core/impl/log/IonLogger');
const encoding = require('encoding');
const fs = require('fs');
const path = require('path');
const Writable = require('stream').Writable;

const classNames = {
  SEXT: 'SEXT@develop-and-test',
  EXTR: 'EXTR@develop-and-test',
  STREET: 'STREET@develop-and-test',
  PLAN: 'PLAN@develop-and-test',
  ADDROBJ_LOW: 'ADDROBJ_LOW@develop-and-test',
  PLACE: 'PLACE@develop-and-test',
  CTAR: 'CTAR@develop-and-test',
  CITY: 'CITY@develop-and-test',
  SETTLEMENT: 'SETTLEMENT@develop-and-test',
  AREA: 'AREA@develop-and-test',
  AUTO: 'AUTO@develop-and-test',
  REGION: 'REGION@develop-and-test',
  ADDROBJ_HIGHLEVEL: 'ADDROBJ_HIGHLEVEL@develop-and-test'
};

var sysLog = new IonLogger({});
var scope = null;
var charset = 'cp866';
var sourcePath = null;
var regionFilter = null;
var isFias = null;

for (var i = 0; i < process.argv.length; i++) {
  if (process.argv[i] === '--sourcePath') {
    sourcePath = process.argv[i + 1];
  } else if (process.argv[i] === '--region') {
    regionFilter = process.argv[i + 1];
  } else if (process.argv[i] === '--charset') {
    charset = process.argv[i + 1];
  } else if (process.argv[i] === '--FIAS') {
    isFias = true;
  } else if (process.argv[i] === '--KLADR') {
    isFias = false;
  }
}

if (isFias === null) {
  isFias = fs.existsSync(path.join(sourcePath, 'ADDROBJ.DBF'));
}

function importFile(fn) {
  return function () {
    return new Promise(function (resolve) {
      var start = new Date();
      var counter = 0;
      var gCounter = 0;
      var parser = new DBF(fn, {parseTypes: false});

      console.log(`Читается файл ${fn}. Он содержит ${parser.header.numberOfRecords} записей.`);

      for (var i = 0; i < parser.header.fields.length; i++) {
        switch (parser.header.fields[i].name) {
          case 'NAME':
          case 'SOCR':
          case 'OFFNAME':
          case 'FORMALNAME':
          case 'SHORTNAME': parser.header.fields[i].raw = true; break;
        }
      }

      parser.stream.pipe(new Writable({
        write: function (record, encoding, cb) {
          importRecord(record)
            .then(function (result) {
              if (result) {
                counter++;
              }
              gCounter++;
              process.stdout.write('\rПрогресс импорта: ' +
                Math.round(gCounter / parser.header.numberOfRecords * 100) + '%');
              cb();
            })
            .catch(function (err) {
              console.error('\r' + err);
              cb();
            });
        },
        objectMode: true
      })).on('finish', function () {
        console.log(`\nИз файла ${fn} импортировано ${counter} записей.` +
          `Затрачено ${(new Date() - start) / 1000} секунд.`);
        resolve();
      });
    });
  };
}

di('app', config.di,
  {sysLog: sysLog},
  null,
  ['auth', 'rtEvents', 'sessionHandler']
).then(function (s) {
  scope = s;
  var p;
  if (isFias) {
    p = importFile(path.join(sourcePath, 'ADDROBJ.DBF'))();
  } else if (!isFias) {
    p = importFile(path.join(sourcePath, 'KLADR.DBF'))()
      .then(importFile(path.join(sourcePath, 'STREET.DBF')));
  } else {
    return Promise.reject(new Error('Не удаётся определить формат импортируемого реестра адресов.'));
  }
  return p;
}).then(function () {
  console.log('Проверка ссылочной целостности адресных элементов');
  return checkContainers(classNames.KLADR, scope.dataRepo, scope.metaRepo);
}).then(function () {
  console.log('Проверка ссылочной целостности улиц');
  return checkContainers(classNames.STREET, scope.dataRepo, scope.metaRepo);
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

function importRecord(record) {
  if (isActual(record) && isFiltered(record)) {
    var className = getRecordClass(record);
    var options = {
      count: 1,
      nestingDepth: 0,
      skipResult: true,
      ignoreIntegrityCheck: true,
      filter: []
    };
    if (isFias) {
      options.filter.push({AOGUID: {$eq: record.AOGUID}});
    } else {
      options.filter.push({CODE: {$eq: record.CODE}});
    }
    return scope.dataRepo.getList(className, options).then(function(item) {
      var dummy = getData(record);
      if (item) {
        for (var val in item.base) {
          if (item.base.hasOwnProperty(val) && dummy.hasOwnProperty(val) && item.base[val] === dummy[val]) {
            delete dummy[val];
          }
        }
        if (Object.keys(dummy).length === 0 && dummy.constructor === Object) {
          return scope.dataRepo.editItem(className, item.getItemId(), dummy);
        }
      } else {
        return scope.dataRepo.createItem(className, dummy);
      }
      return Promise.resolve();
    });
  }
  return Promise.resolve();
}

function checkContainers(className, dataRepo) {
  return dataRepo.getList(className, {
    filter: {$and: [
      {CONTAINER: {$empty: false}},
      {'CONTAINER.CODE': {$empty: true}}
    ]},
    nestingDepth: 0
  }).then(function (result) {
    for (var i = 0; i < result.length; i++) {
      console.error(`Запись ${result[i].base.CODE} ссылается на несуществующий контейнер ${result[i].base.CONTAINER}`);
    }
    return result;
  });
}

function isActual(record) {
  return isFias && record.LIVESTATUS === '1' && record.ACTSTATUS === '1' ||
    !isFias && record.CODE.substring(record.CODE.length - 2) === '00';
}

function isFiltered(record) {
  return !regionFilter ||
    isFias && record.REGIONCODE === regionFilter ||
    !isFias && record.CODE.substring(0, 2) === regionFilter;
}

function getRecordClass(record) {
  if (isFias) {
    switch (record.AOLEVEL) {
      case '1':   return classNames.REGION;
      case '2':   return classNames.AUTO;
      case '3':   return classNames.AREA;
      case '35':  return classNames.SETTLEMENT;
      case '4':   return classNames.CITY;
      case '5':   return classNames.CTAR;
      case '6':   return classNames.PLACE;
      case '65':  return classNames.PLAN;
      case '7':   return classNames.STREET;
      case '90':  return classNames.EXTR;
      case '91':  return classNames.SEXT;
    }
  } else if (!isFias) {
    if (record.CODE.length === 13) {
      if (record.CODE.substring(2, 11) === '000000000') {
        return classNames.REGION;
      } else if (record.CODE.substring(5, 11) === '000000') {
        return classNames.AREA;
      } else if (record.CODE.substring(8, 11) === '000') {
        return classNames.CITY;
      } else {
        return classNames.PLACE;
      }
    } else if (record.CODE.length === 17) {
      return classNames.STREET;
    }
  }
  throw new Error('Не удаётся определить тип записи ' + record.CODE + '.');
}

function getData(record, className) {
  var data = {};
  if (isFias) {
    data.ID = record.AOGUID;
    data.AOGUID = record.AOGUID;
    data.CODE = record.CODE;
    data.SHORTNAME = convertCharset(record.SHORTNAME);
    data.OFFNAME = convertCharset(record.OFFNAME);
    data.FORMALNAME = convertCharset(record.FORMALNAME);
    data.OKATO = record.OKATO;
    data.OKTMO = record.OKTMO;
    data.POSTALCODE = record.POSTALCODE;
    data.CONTAINER = record.PARENTGUID;
  } else if (!isFias) {
    data.CODE = record.CODE;
    data.SHORTNAME = convertCharset(record.SOCR);
    data.OFFNAME = convertCharset(record.NAME);
    data.OKATO = record.OCATD;
    data.POSTALCODE = record.INDEX;
  }
  return data;
}

function convertCharset(text) {
  return encoding.convert(text, 'utf-8', charset).toString();
}
