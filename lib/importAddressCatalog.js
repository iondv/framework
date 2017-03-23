'use strict';
/* jshint maxstatements: 100, maxcomplexity: 100*/

const fs = require('fs');
const path = require('path');
const DBF = require('stream-dbf');
const Writable = require('stream').Writable;
const Item = require('core/interfaces/DataRepository').Item;
const encoding = require('encoding');

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

var logs = [];
var isBusy = false;

module.exports = function (sourcePath, regionFilter, dataRepo) {
  var isFias = null;
  var start = new Date();

  return new Promise (function (resolve, reject) {
    if (isBusy) {
      return reject(new Error('На данный момент импорт уже выполняется.'));
    }

    isBusy = true;
    logs = [];
    start = new Date();

    var rF = parseInt(regionFilter);
    if (rF < 100 || rF > 0) {
      if (regionFilter.length === 1) {
        regionFilter = '0' + regionFilter;
      }
    } else {
      return reject(new Error('Фильтр по регионам не соответствует формату.'));
    }

    if (fs.existsSync(path.join(sourcePath, 'ADDROBJ.DBF'))) {
      isFias = true;
    } else if (fs.existsSync(path.join(sourcePath, 'KLADR.DBF'))) {
      isFias = false;
    } else {
      return reject(new Error('Не удаётся определить формат импортируемого реестра адресов.'));
    }

    return resolve();
  }).then(function () {
    var log = createLog();
    logs.push(log);
    if (isFias === true) {
      return importFile(path.join(sourcePath, 'ADDROBJ.DBF'), log, importRecord(dataRepo, isFias, regionFilter));
    } else {
      return importFile(path.join(sourcePath, 'KLADR.DBF'), log, importRecord(dataRepo, isFias, regionFilter))
        .then(function () {
          var ololog = createLog();
          logs.push(ololog);
          return importFile(path.join(sourcePath, 'STREET.DBF'), ololog, importRecord(dataRepo, isFias, regionFilter));
        });
    }
  }).then(function () {
    if (isFias === false) {
      var log = createLog('Обработка переподчинений.');
      logs.push(log);
      return importFile(path.join(sourcePath, log, 'ALTNAMES.DBF'), reassign);
    }
    return Promise.resolve();
  }).then(function () {
    if (isFias === false) {
      var log = createLog('Установка ссылок на контейнеры.');
      logs.push(log);
      return dataRepo.getIterator(classNames.REGION, {
        nestingDepth: 0,
        countTotal: true
      }).then(function (iterator) {
        var counter = 0;
        return iteratorToChain(iterator, function (item) {
          return setContainersByItem(dataRepo)(item).then(function () {
            counter++;
            log.progress = counter / iterator.count();
          });
        })();
      });
    }
    return Promise.resolve();
  }).then(function () {
    var log = createLog('Проверка ссылочной целостности реестра.');
    logs.push(log);
    return dataRepo.getIterator(classNames.ADDROBJ, {
      filter: {$and: [
        {_class: {$ne: classNames.REGION}},
        {CONTAINER: {$empty: true}}
      ]},
      nestingDepth: 0,
      countTotal: true
    }).then(function (iterator) {
      return iteratorToChain(iterator, function (item) {
        log.errors.push(`Запись ${item.getItemId()} не имеет ссылки на контейнер.`);
        return Promise.resolve();
      });
    }).then(function () {
      log.progress = 0.5;
      return dataRepo.getIterator(classNames.ADDROBJ, {
        filter: {$and: [
          {CONTAINER: {$empty: false}},
          {'CONTAINER.ID': {$empty: true}}
        ]},
        nestingDepth: 0,
        countTotal: true
      });
    }).then(function (iterator) {
      return iteratorToChain(iterator, function (item) {
        log.errors.push(`Запись ${item.getItemId()} ссылается на несуществующий контейнер.`);
        return Promise.resolve();
      });
    }).then(function () {
      log.progress = 1;
    });
  }).then(function () {
    var log = createLog('Дублирование записей верхнего уровня.');
    logs.push(log);
    var counter = 0;
    return dataRepo.getIterator(classNames.ADDROBJ, {
      filter: {$and: [
        {_class: {$ne: classNames.PLAN}},
        {_class: {$ne: classNames.STREET}},
        {_class: {$ne: classNames.EXTR}},
        {_class: {$ne: classNames.SEXT}}
      ]},
      nestingDepth: 0,
      countTotal: true
    }).then(function (iterator) {
      return iteratorToChain(iterator, function (item) {
        var data = {};
        for (var p in item.base) {
          if (item.base.hasOwnProperty(p) && p[0] !== '_') {
            data[p] = item.base[p];
          }
        }
        return dataRepo.saveItem(item.getClassName().replace('@', '_REPLICA@'), item.getItemId(), data, null, null,
          {
            skipResult: true,
            ignoreIntegrityCheck: true
          }).then(function (result) {
          if (result) {
            counter++;
            log.progress = counter / iterator.count();
          }
        });
      })();
    }).then(function () {
      log.warnings.push(`Дублировано ${counter} записей верхнего уровня.`);
      return Promise.resolve();
    });
  }).then(function () {
    logs.push(createLog('Импорт справочника адресов завершен.', 1,
      [`Затрачено ${Math.round((new Date() - start) / 60000)} мин.`]));
    isBusy = false;
    return Promise.resolve();
  }).catch(function (err) {
    isBusy = false;
    return Promise.reject(err);
  });
};

function createLog(s, pr, warns, errs) {
  return {
    stage: s,
    progress: pr || 0,
    warnings: warns || [],
    errors: warns || [],
    timestamp: new Date()
  };
}

function importFile(fn, log, recordCallback) {
  return new Promise(function (resolve) {
    log.state = `Читается файл ${fn}.`;
    var counter = 0;
    var gCounter = 0;
    var parser = new DBF(fn, {parseTypes: false});

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
        recordCallback(record, log).then(function (result) {
          if (result) {
            counter++;
          }
          gCounter++;
          log.progress = gCounter / parser.header.numberOfRecords;
          cb();
        }).catch(function (err) {
          log.errors.push(err);
          cb();
        });
      },
      objectMode: true
    })).on('finish', function () {
      log.warnings.push(`Перенесено ${counter} записей из ${parser.header.numberOfRecords}.`);
      resolve();
    });
  });
}

function importRecord(dataRepo, isFias, regionFilter) {
  return function (record, log) {
    if (isActual(record, isFias) && isFiltered(record, isFias, regionFilter)) {
      var className = getRecordClass(record, isFias);
      var p = null;
      if (isFias === true) {
        p = dataRepo.getItem(className, record.AOGUID, {nestingDepth: 0});
      } else {
        p = dataRepo.getList(className, {
          count: 1,
          nestingDepth: 0,
          filter: {KLADR_CODE: {$eq: record.CODE.substring(0, record.CODE.length - 2)}}
        });
      }
      return p.then(function (result) {
        var item = null;
        if (Array.isArray(result) && result.length > 0) {
          item = result[0];
        } else if (result instanceof Item) {
          item = result;
        }
        var dummy = getData(record, className, isFias);
        var options = {
          skipResult: true,
          ignoreIntegrityCheck: true
        };
        if (item) {
          for (var val in item.base) {
            if (item.base.hasOwnProperty(val) && dummy.hasOwnProperty(val)) {
              if (item.base[val] === dummy[val] || val === 'CONTAINER' && isFias === false) {
                delete dummy[val];
              }
            }
          }
          if (Object.keys(dummy).length > 0) {
            return dataRepo.editItem(className, item.getItemId(), dummy, null, options);
          }
        } else {
          if (Object.keys(dummy).length > 0) {
            return dataRepo.createItem(className, dummy, null, null, options);
          }
        }
        return Promise.resolve();
      });
    } else if (isFias === false && record.CODE.substring(record.CODE.length - 2) === '51') {
      return dataRepo.getList(getRecordClass(record, isFias), {
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
          return dataRepo.bulkUpdate(
            classNames.ADDROBJ,
            {
              skipResult: true,
              filter: {CONTAINER: {$eq: item.getItemId()}}
            },
            {
              CONTAINER: item.base.KLADR_CODE
            }).then(function () {
            return dataRepo.deleteItem(item.getClassName(), item.getItemId()).then(function () {
              log.warning.push(`Удален из реестра более неактуальный адресный объект ${item.base.KLADR_CODE}.`);
              return Promise.resolve();
            });
          });
        }
        return Promise.resolve();
      });
    }
    return Promise.resolve();
  };
}

function reassign(dataRepo, regionFilter) {
  return function (record, log) {
    if (regionFilter && !fiasRegionFilter(record.OLDCODE, regionFilter)) {
      return Promise.resolve();
    }
    var className = classNameByFiasCode(record.NEWCODE);
    return dataRepo.getList(className, {
      count: 1,
      nestingDepth: 0,
      filter: {KLADR_CODE: {$eq: record.NEWCODE.substring(0, record.NEWCODE.length - 2)}}
    }).then(function (containers) {
      var container = null;
      if (Array.isArray(containers) && containers.length > 0) {
        container = containers[0];
      }

      return dataRepo.bulkUpdate(
        classNames.ADDROBJ,
        {
          skipResult: true,
          filter: {CONTAINER: {$eq: record.OLDCODE.substring(0, record.OLDCODE.length - 2)}}
        },
        {
          CONTAINER: container ? container.getItemId() : record.NEWCODE.substring(0, record.NEWCODE.length - 2)
        });
    });
  };
}

function isActual(record, isFias) {
  return isFias === true && record.LIVESTATUS === '1' && record.ACTSTATUS === '1' ||
    isFias === false &&
    (record.CODE.substring(record.CODE.length - 2) === '00' || record.CODE.substring(record.CODE.length - 2) === '99');
}

function isFiltered(record, isFias, regionFilter) {
  return !regionFilter ||
    isFias === true && record.REGIONCODE === regionFilter ||
    isFias === false && fiasRegionFilter(record.CODE, regionFilter);
}

function fiasRegionFilter(code, regionFilter) {
  return code.substring(0, 2) === regionFilter;
}

function getRecordClass(record, isFias) {
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

function getData(record, className, isFias) {
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
  return encoding.convert(text, 'utf-8', 'cp866').toString();
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

function setContainersByItem(dataRepo) {
  return function (item) {
    return dataRepo.bulkUpdate(
      classNames.ADDROBJ,
      {
        skipResult: true,
        filter: {CONTAINER: {$eq: item.base.KLADR_CODE}}
      },
      {
        CONTAINER: item.getItemId()
      }
    ).then(function () {
      return dataRepo.getIterator(classNames.ADDROBJ, {
        nestingDepth: 0,
        countTotal: true,
        filter: {CONTAINER: {$eq: item.getItemId()}}
      }).then(function (iterator) {
        return iteratorToChain(iterator, setContainersByItem(dataRepo))();
      });
    });
  };
}
