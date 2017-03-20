/**
 * Created by Данил on 17.02.2017.
 */

/* jshint maxstatements: 100, maxcomplexity: 100*/

const DBF = require('stream-dbf');
const config = require('../config');
const di = require('core/di');
const IonLogger = require('core/impl/log/IonLogger');
const Item = require('core/interfaces/DataRepository').Item;
const encoding = require('encoding');
const fs = require('fs');
const path = require('path');
const Writable = require('stream').Writable;

const classNames = {
  SEXT: 'SEXT@develop-and-test',
  EXTR: 'EXTR@develop-and-test',
  STREET: 'STREET@develop-and-test',
  PLAN: 'PLAN@develop-and-test',
  PLACE: 'PLACE@develop-and-test',
  CTAR: 'CTAR@develop-and-test',
  CITY: 'CITY@develop-and-test',
  SETTLEMENT: 'SETTLEMENT@develop-and-test',
  AREA: 'AREA@develop-and-test',
  AUTO: 'AUTO@develop-and-test',
  REGION: 'REGION@develop-and-test',
  ADDROBJ: 'ADDROBJ@develop-and-test'
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
  if (fs.existsSync(path.join(sourcePath, 'ADDROBJ.DBF'))) {
    isFias = true;
  } else if (fs.existsSync(path.join(sourcePath, 'KLADR.DBF'))) {
    isFias = false;
  }
}

di('app', config.di,
  {sysLog: sysLog},
  null,
  ['auth', 'rtEvents', 'sessionHandler']
).then(function (s) {
  scope = s;
  if (isFias === true) {
    return importFile(path.join(sourcePath, 'ADDROBJ.DBF'), importRecord);
  } else if (isFias === false) {
    return importFile(path.join(sourcePath, 'KLADR.DBF'), importRecord)
      .then(function () {
        return importFile(path.join(sourcePath, 'STREET.DBF'), importRecord);
      });
  } else {
    return Promise.reject(new Error('Не удаётся определить формат импортируемого реестра адресов.'));
  }
}).then(function () {
  if (isFias === false) {
    return importFile(path.join(sourcePath, 'ALTNAMES.DBF'), reassign).then(setContainers);
  }
  return Promise.resolve();
}).then(function () {
  return checkContainers();
}).then(function () {
  return makeCopies();
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

function importFile(fn, recordCallback) {
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
        recordCallback(record).then(function (result) {
          if (result) { counter++; }
          gCounter++;
          process.stdout.write('\rПрогресс: ' + Math.round(gCounter / parser.header.numberOfRecords * 100) + '%');
          cb();
        }).catch(function (err) {
          console.error('\r' + err);
          cb();
        });
      },
      objectMode: true
    })).on('finish', function () {
      console.log(`\nОбработано ${counter} записей. Затрачено ${(new Date() - start) / 1000} секунд.`);
      resolve();
    });
  });
}

function importRecord(record) {
  if (isActual(record) && isFiltered(record)) {
    var className = getRecordClass(record);
    var p = null;
    if (isFias === true) {
      p = scope.dataRepo.getItem(className, record.AOGUID, {nestingDepth: 0});
    } else if (isFias === false) {
      p = scope.dataRepo.getList(className, {
        count: 1,
        nestingDepth: 0,
        filter: {KLADR_CODE: {$eq: record.CODE.substring(0, record.CODE.length - 2)}}
      });
    } else {
      return Promise.reject(new Error('Не удаётся определить формат импортируемой записи.'));
    }
    return p.then(function (result) {
      var item = null;
      if (Array.isArray(result) && result.length > 0) {
        item = result[0];
      } else if (result instanceof Item) {
        item = result;
      }
      var dummy = getData(record, className);
      var options = {
        skipResult: true,
        ignoreIntegrityCheck: true
      };
      if (item) {
        for (var val in item.base) {
          if (item.base.hasOwnProperty(val) && dummy.hasOwnProperty(val) && item.base[val] === dummy[val]) {
            delete dummy[val];
          }
        }
        if (Object.keys(dummy).length > 0) {
          return scope.dataRepo.editItem(className, item.getItemId(), dummy, null, options);
        }
      } else {
        if (Object.keys(dummy).length > 0) {
          return scope.dataRepo.createItem(className, dummy, null, null, options);
        }
      }
      return Promise.resolve();
    });
  } else if (isFias === false && record.CODE.substring(record.CODE.length - 2) === '51') {
    return scope.dataRepo.getList(getRecordClass(record), {
      count: 1,
      nestingDepth: 0,
      filter: {
        KLADR_CODE: {$eq: record.CODE.substring(0, record.CODE.length - 2)}
      }
    }).then(function (results) {
      var item = null;
      if (Array.isArray(results) && results.length > 0) {
        item = results[0];
      }
      if (item) {
        return scope.dataRepo.bulkUpdate(
          classNames.ADDROBJ,
          {
            skipResult: true,
            filter: {CONTAINER: {$eq: item.getItemId()}}
          },
          {
            CONTAINER: item.base.KLADR_CODE
          }).then(function () {
            return scope.dataRepo.deleteItem(item.getClassName(), item.getItemId());
          });
      }
      return Promise.resolve();
    });
  }
  return Promise.resolve();
}

function iteratorToChain(iterator, callback) {
  return function () {
    return iterator.next().then(function (item) {
      if (item) {
        return callback(item).then(iteratorToChain(iterator, callback));
      }
      return Promise.resolve();
    });
  };
}

function setContainersByItem(item) {
  return scope.dataRepo.bulkUpdate(
    classNames.ADDROBJ,
    {
      skipResult: true,
      filter: {CONTAINER: {$eq: item.base.KLADR_CODE}}
    },
    {
      CONTAINER: item.getItemId()
    }
  ).then(function () {
    return scope.dataRepo.getIterator(classNames.ADDROBJ, {
      nestingDepth: 0,
      filter: {CONTAINER: {$eq: item.base.KLADR_CODE}}
    }).then(function (iterator) {
      return iteratorToChain(iterator, setContainersByItem)();
    });
  });
}

function setContainers() {
  return scope.dataRepo.getIterator(classNames.REGION, {nestingDepth: 0}).then(function (iterator) {
    return iteratorToChain(iterator, setContainersByItem)();
  });
}

function reassign(record) {
  var className = classNameByFiasCode(record.NEWCODE);
  return scope.dataRepo.getList(className, {
    count: 1,
    nestingDepth: 0,
    filter: {KLADR_CODE: {$eq: record.NEWCODE.substring(0, 11)}}
  }).then(function (containers) {
    var container = null;
    if (Array.isArray(containers) && containers.length > 0) {
      container = containers[0];
    }
    if (container) {
      return scope.dataRepo.bulkUpdate(
        classNames.ADDROBJ,
        {
          skipResult: true,
          filter: {CONTAINER: {$eq: record.OLDCODE.substring(0, 11)}}
        },
        {
          CONTAINER: container.getItemId()
        });
    } else {
      return Promise.reject(new Error(`Не удаётся найти переподчиненную запись ${record.NEWCODE}.`));
    }
  });
}

function checkContainers() {
  return scope.dataRepo.getIterator(classNames.ADDROBJ, {
    filter: {$and: [
      {_class: {$ne: classNames.REGION}},
      {CONTAINER: {$empty: true}}
    ]},
    nestingDepth: 0
  }).then(function (iterator) {
    return iteratorToChain(iterator, function (item) {
      console.error(`Запись ${item.getItemId()}, ` +
        `принадлежащая классу ${item.getClassName()}, не имеет ссылки на контейнер.`);
    });
  }).then(function () {
    return scope.dataRepo.getIterator(classNames.ADDROBJ, {
      filter: {$and: [
        {CONTAINER: {$empty: false}},
        {'CONTAINER.ID': {$empty: true}}
      ]},
      nestingDepth: 0
    });
  }).then(function (iterator) {
    return iteratorToChain(iterator, function (item) {
      console.error(`Запись ${item.getItemId()} ссылается на несуществующий контейнер ${item.base.CONTAINER}.`);
    });
  });
}

function makeCopies() {
  return scope.dataRepo.getIterator(classNames.ADDROBJ, {
    filter: {$and: [
      {_class: {$ne: classNames.PLAN}},
      {_class: {$ne: classNames.STREET}},
      {_class: {$ne: classNames.EXTR}},
      {_class: {$ne: classNames.SEXT}}
    ]},
    nestingDepth: 0
  }).then(function (iterator) {
    return iteratorToChain(iterator, function (item) {
      var data = {};
      for (var p in item.base) {
        if (item.base.hasOwnProperty(p) && p[0] === '_') {
          data[p] = item.base[p];
        }
      }
      return scope.dataRepo.createItem(item.getClassName().replace('@', '_REPLICA@'), data, null, null,
        {
          skipResult: true,
          ignoreIntegrityCheck: true
        });
    });
  });
}

function isActual(record) {
  return isFias === true && record.LIVESTATUS === '1' && record.ACTSTATUS === '1' ||
    isFias === false &&
    (record.CODE.substring(record.CODE.length - 2) === '00' || record.CODE.substring(record.CODE.length - 2) === '99');
}

function isFiltered(record) {
  return !regionFilter ||
    isFias === true && record.REGIONCODE === regionFilter ||
    isFias === false && record.CODE.substring(0, 2) === regionFilter;
}

function getRecordClass(record) {
  if (isFias === true) {
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
  } else if (isFias === false) {
    return classNameByFiasCode(record.CODE);
  }
  throw new Error('Не удаётся определить тип записи.');
}

function classNameByFiasCode(code) {
  if (code.length === 13) {
    if (code.substring(2, 11) === '000000000') {
      return classNames.REGION;
    } else if (code.substring(5, 11) === '000000') {
      return classNames.AREA;
    } else if (code.substring(8, 11) === '000') {
      return classNames.CITY;
    } else {
      return classNames.PLACE;
    }
  } else if (code.length === 17) {
    return classNames.STREET;
  }
}

function getData(record, className) {
  var data = {};
  if (isFias === true) {
    data.ID = record.AOGUID;
    data.FIAS_AOGUID = record.AOGUID;
    data.KLADR_CODE = record.PLAINCODE;
    data.SHORTNAME = convertCharset(record.SHORTNAME);
    data.OFFNAME = convertCharset(record.OFFNAME);
    data.FORMALNAME = convertCharset(record.FORMALNAME);
    data.OKATO = record.OKATO;
    data.OKTMO = record.OKTMO;
    data.POSTALCODE = record.POSTALCODE;
    data.CONTAINER = record.PARENTGUID;
  } else if (isFias === false) {
    data.KLADR_CODE = record.CODE.substring(0, record.CODE.length - 2);
    data.SHORTNAME = convertCharset(record.SOCR);
    data.OFFNAME = convertCharset(record.NAME);
    data.OKATO = record.OCATD;
    data.POSTALCODE = record.INDEX;
    switch (className) {
      case classNames.AREA: data.CONTAINER = data.KLADR_CODE.substring(0, 2) + '000000000'; break;
      case classNames.CITY: data.CONTAINER = data.KLADR_CODE.substring(0, 5) + '000000'; break;
      case classNames.PLACE: data.CONTAINER = data.KLADR_CODE.substring(0, 8) + '000'; break;
      case classNames.STREET: data.CONTAINER = data.KLADR_CODE.substring(0, 11); break;
    }
  }
  return data;
}

function convertCharset(text) {
  return encoding.convert(text, 'utf-8', charset).toString();
}
