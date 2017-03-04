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

const classNames = {
  STREET: 'STREET@develop-and-test',
  PLACE: 'PLACE@develop-and-test',
  CITY: 'CITY@develop-and-test',
  AREA: 'AREA@develop-and-test',
  REGION: 'REGION@develop-and-test',
  KLADR: 'KLADR@develop-and-test'
};

var sysLog = new IonLogger({});
var scope = null;
var charset = 'cp866';
var sourcePath = null;
var regionFilter = null;

for (var i = 0; i < process.argv.length; i++) {
  if (process.argv[i] === '--sourcePath') {
    sourcePath = process.argv[i + 1];
  } else if (process.argv[i] === '--region') {
    regionFilter = process.argv[i + 1];
  } else if (process.argv[i] === '--charset') {
    charset = process.argv[i + 1];
  }
}

di('app', config.di,
  {sysLog: sysLog},
  null,
  ['auth', 'rtEvents', 'sessionHandler']
).then(function (s) {

  return new Promise (function (resolve) {
    scope = s;
    var fls = [];
    var promises = null;
    fs.readdirSync(sourcePath).forEach(function (file) {
      if (file === 'KLADR.DBF' || file === 'STREET.DBF' || file === 'ADDROBJ.DBF') {
        fls.push(sourcePath + '/' + file);
      }
    });
    if (fls.length > 0) {
      sequenceReadFiles(fls, 0, promises);
    } else {
      throw new Error('Указанная директория не содержит необходимых для импорта .DBF-файлов формата КЛАДР либо ФИАС.');
    }

    function sequenceReadFiles(files, index, chain) {
      console.log('Читается файл ' + files[index]);
      var counter = 0;

      var parser = new DBF(files[index], {parseTypes: false});
      for (var i = 0; i < parser.header.fields.length; i++) {
        switch (parser.header.fields[i].name) {
          case 'NAME':
          case 'SOCR':
          case 'FORMALNAME':
          case 'SHORTNAME': {
            parser.header.fields[i].raw = true;
          } break;
        }
      }
      var stream = parser.stream;

      stream.on('data', function (record) {
        if (record) {
          stream.pause();
          if (chain) {
            chain = chain.then(importRecord(record));
          } else {
            chain = importRecord(record)();
          }
          chain = chain.then(function (result) {
            stream.resume();
            if (result) {
              counter++;
            }
            return Promise.resolve();
          });
        }
      });
      stream.on('end', function () {
        chain = chain.then(function () {
          console.log('Из файла ' + files[index] + ' импортировано ' + counter + ' записей');
          counter = 0;
          if (index < files.length - 1) {
            sequenceReadFiles(files, index + 1, chain);
          } else {
            resolve();
          }
          return Promise.resolve();
        });
      });
    }
  });
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
  return function () {
    var fias = record.hasOwnProperty('NORMDOC');
    var className = getRecordClass(record, fias);
    if (
      className &&
      ((fias && record.ACTSTATUS === '1') || (!fias && record.CODE.substring(record.CODE.length - 2) === '00')) &&
      (!regionFilter || record.CODE.substring(0, 2) === regionFilter)
    ) {
      return scope.dataRepo.saveItem(
        className,
        null,
        getData(record, className, fias),
        null,
        null,
        {
          skipResult: true,
          nestingDepth: 0,
          autoAssign: true,
          ignoreIntegrityCheck: true
        });
    }
    return Promise.resolve();
  };
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
      console.error('Запись ' + result[i].base.CODE + ' ссылается на несуществующий контейнер ' + result[i].base.CONTAINER);
    }
    return result;
  });
}

function getRecordClass(record, fias) {
  if (fias) {
    if (record.STREETCODE && record.STREETCODE !== '0000') {
      return classNames.STREET;
    } else if (record.PLANCODE && record.PLANCODE !== '0000') {
      return null; // TODO: Требует обсуждения, возможно имеет смысл приводить к соседнему уровню
    } else if (record.PLACECODE && record.PLACECODE !== '000') {
      return classNames.PLACE;
    } else if (record.CTARCODE && record.CTARCODE !== '000') {
      return null; // TODO: Требует обсуждения, возможно имеет смысл приводить к соседнему уровню
    } else if (record.CITYCODE && record.CITYCODE !== '000') {
      return classNames.CITY;
    } else if (record.AREACODE && record.AREACODE !== '000') {
      return classNames.AREA;
    } else if (record.AUTOCODE && record.AUTOCODE !== '000') {
      return null; // TODO: Требует обсуждения, возможно имеет смысл приводить к соседнему уровню
    } else if (record.REGIONCODE && record.REGIONCODE !== '00') {
      return classNames.REGION;
    }
  } else {
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
  return null;
}

function getData(record, className, fias) {
  var data = {};

  if (fias) {
    data.CODE = record.REGIONCODE + record.AREACODE + record.CITYCODE + record.PLACECODE;
    if (className === classNames.STREET) {
      data.CODE = data.CODE + record.STREETCODE;
    }
  } else {
    data.CODE = record.CODE.substring(0, record.CODE.length - 2);
  }

  switch (className) {
    case classNames.STREET: {data.CONTAINER = data.CODE.substring(0, 11);} break;
    case classNames.PLACE: {data.CONTAINER = data.CODE.substring(0, 8) + '000';} break;
    case classNames.CITY: {data.CONTAINER = data.CODE.substring(0, 5) + '000000';} break;
    case classNames.AREA: {data.CONTAINER = data.CODE.substring(0, 2) + '000000000';} break;
  }

  if (fias) {
    data.NAME = convertCharset(record.FORMALNAME);
    data.SOCR = convertCharset(record.SHORTNAME);
    data.INDEX = record.POSTALCODE;
    data.GNINMB = record.IFNSUL.length > 0 ? record.IFNSUL : record.IFNSFL;
    data.UNO = record.TERRIFNSUL.length > 0 ? record.TERRIFNSUL : record.TERRIFNSFL;
    data.OCATD = record.OKATO;
  } else {
    data.NAME = convertCharset(record.NAME);
    data.SOCR = convertCharset(record.SOCR);
    data.INDEX = record.INDEX;
    data.GNINMB = record.GNINMB;
    data.UNO = record.UNO;
    data.OCATD = record.OCATD;
  }

  return data;
}

function convertCharset(text) {
  return encoding.convert(text, 'utf-8', charset).toString();
}
