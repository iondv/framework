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

var progress = null;

module.exports.progress = function () {
  return progress ? Math.round(progress * 100) + '%' : null;
};

/**
 * @param {String} sourcePath
 * @param {String} regionFilter
 * @param {dataRepository} dataRepo
 * @param {Logger} logger
 * @returns {Promise.<TResult>}
 */
module.exports.start = function (sourcePath, regionFilter, dataRepo, logger) {
  if (regionFilter) {
    var rF = parseInt(regionFilter);
    if (rF && rF < 100 && rF > 0) {
      if (regionFilter.length === 1) {
        regionFilter = '0' + regionFilter;
      }
    } else {
      throw new Error('Фильтр по регионам не соответствует формату.');
    }
  }

  var start = new Date();
  var isFias = null;

  if (fs.existsSync(path.join(sourcePath, 'ADDROBJ.DBF'))) {
    isFias = true;
  } else if (fs.existsSync(path.join(sourcePath, 'KLADR.DBF'))) {
    isFias = false;
  } else {
    throw new Error('Не удаётся определить формат импортируемого реестра адресов.');
  }

  return Promise.resolve().
    then(function () {
    var importer = getRecordImporter(dataRepo, isFias, regionFilter);
    if (isFias === true) {
      return importFile(path.join(sourcePath, 'ADDROBJ.DBF'), logger, importer);
    } else {
      return importFile(path.join(sourcePath, 'KLADR.DBF'), logger, importer)
        .then(function () {
          return importFile(path.join(sourcePath, 'STREET.DBF'), logger, importer);
        });
    }
  }).then(function () {
    if (isFias === false) {
      logger.log('Обработка переподчинений');
      return importFile(path.join(sourcePath, 'ALTNAMES.DBF'), logger, function (record) {
        if (regionFilter && !fiasRegionFilter(record.OLDCODE, regionFilter)) {
          return Promise.resolve();
        }
        var actualCode = null;
        return dataRepo.getList(
          classNameByFiasCode(record.NEWCODE),
          {
            count: 1,
            nestingDepth: 0,
            filter: {KLADR_CODE: {$eq: record.NEWCODE.substring(0, record.NEWCODE.length - 2)}}
          }
        ).then(function (result) {
          var newItem = null;
          if (Array.isArray(result) && result.length > 0) {
            newItem = result[0];
          }
          if (newItem) {
            actualCode = newItem.base.actualCode || newItem.getItemId();
            return dataRepo.bulkUpdate(classNames.ADDROBJ, {
                skipResult: true,
                filter: {CONTAINER: {$eq: record.OLDCODE.substring(0, record.OLDCODE.length - 2)}}
              },
              {CONTAINER: actualCode}
            );
          }
          return Promise.resolve();
        }).then(function () {
          var options = {
            skipResult: true,
            filter: {$or: [
              {KLADR_CODE: {$eq: record.OLDCODE.substring(0, record.OLDCODE.length - 2)}},
              {$and: [
                {isNotActual: {$eq: true}},
                {actualCode: {$eq: record.OLDCODE.substring(0, record.OLDCODE.length - 2)}}
              ]}
            ]}
          };
          var updts = {isNotActual: true};
          if (actualCode) {
            updts.actualCode = actualCode;
          }
          return dataRepo.bulkUpdate(classNames.ADDROBJ, options, updts);
        });
      });
    }
    return Promise.resolve();
  }).then(function () {
    if (isFias === false) {
      logger.log('Удаление неактуальных записей.');
      progress = 0;
      return dataRepo.getIterator(classNames.ADDROBJ, {
        filter: {$and: [
          {isNotActual: {$eq: true}},
          {actualCode: {$empty: false}}
        ]},
        nestingDepth: 0,
        countTotal: true
      }).then(function (iterator) {
        return iteratorToChain(iterator, function (item) {
          return dataRepo.deleteItem(item.getClassName(), item.getItemId()).
          then(function () {
            progress += 1 / iterator.count();
          });
        })();
      });
    }
    return Promise.resolve();
  }).then(function () {
    if (isFias === false) {
      logger.log('Установка ссылок на контейнеры.');
      progress = 0;
      var options = {
        nestingDepth: 0,
        countTotal: true
      };
      if (regionFilter) {
        options.filter = {KLADR_CODE: {$eq: regionFilter + '000000000'}};
      }
      return dataRepo.getIterator(classNames.REGION, options).then(function (iterator) {
        return iteratorToChain(iterator, function (item) {
          return setContainersByItem(dataRepo)(item).then(function () {
            progress += 1 / iterator.count();
          });
        })();
      });
    }
    return Promise.resolve();
  }).then(function () {
    logger.log('Проверка ссылочной целостности реестра.');
    progress = 0;
    return dataRepo.getIterator(classNames.ADDROBJ, {
      filter: {$and: [
        {_class: {$ne: classNames.REGION}},
        {CONTAINER: {$empty: true}}
      ]},
      nestingDepth: 0,
      countTotal: true
    }).then(function (iterator) {
      progress = 0.2;
      return iteratorToChain(iterator, function (item) {
        logger.warn(`Запись ${item.getItemId()} не имеет ссылки на контейнер.`);
        return Promise.resolve();
      })();
    }).then(function () {
      progress = 0.4;
      return dataRepo.getIterator(classNames.ADDROBJ, {
        filter: {$and: [
          {CONTAINER: {$empty: false}},
          {'CONTAINER.ID': {$empty: true}}
        ]},
        nestingDepth: 0,
        countTotal: true
      });
    }).then(function (iterator) {
      progress = 0.6;
      return iteratorToChain(iterator, function (item) {
        logger.warn(`Запись ${item.getItemId()} ссылается на несуществующий контейнер.`);
        return Promise.resolve();
      })();
    }).then(function () {
      progress = 0.8;
      return dataRepo.getIterator(classNames.ADDROBJ, {
        filter: {$or: [
          {isNotActual: {$eq: true}},
          {actualCode: {$empty: false}}
        ]},
        nestingDepth: 0,
        countTotal: true
      });
    }).then(function (iterator) {
      return iteratorToChain(iterator, function (item) {
        logger.warn(`Запись ${item.getItemId()} является неактуальной` +
          (item.base._actualCode ? ` и ссылается на запись ${item.base._actualCode}.` : `.`));
        return Promise.resolve();
      })();
    });
  }).then(function () {
    logger.log('Дублирование записей верхнего уровня.');
    progress = 0;
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
            progress += 1 / iterator.count();
          }
        });
      })();
    });
  }).then(function () {
    logger.log(`Импорт справочника адресов завершен. Затрачено ${Math.round((new Date() - start) / 60000)} мин.`);
    progress = null;
    return Promise.resolve();
  });
};

function importFile(fn, logger, recordCallback) {
  return new Promise(function (resolve) {
    logger.log(`Читается файл ${fn}.`);
    var counter = 0;
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
        recordCallback(record).then(function (result) {
          if (result) {
            counter++;
          }
          progress += 1 / parser.header.numberOfRecords;
          cb();
        }).catch(function (err) {
          logger.error(err);
          cb();
        });
      },
      objectMode: true
    })).on('finish', function () {
      progress = null;
      logger.log(`Готово. Перенесено ${counter} записей из ${parser.header.numberOfRecords}.`);
      resolve();
    });
  });
}

function getRecordImporter(dataRepo, isFias, regionFilter) {
  return function (record) {
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
      var item = null;
      return p.then(function (result) {
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
      }).then(function () {
        if (item && isFias === false && record.CODE.substring(record.CODE.length - 2) === '51') {
          return dataRepo.bulkUpdate(
            classNames.ADDROBJ,
            {
              skipResult: true,
              filter: {CONTAINER: {$eq: item.getItemId()}}
            },
            {
              CONTAINER: item.base.KLADR_CODE
            });
        }
        return Promise.resolve(true);
      });
    }
    return Promise.resolve();
  };
}

function isActual(record, isFias) {
  return isFias === true && record.LIVESTATUS === '1' && record.ACTSTATUS === '1' ||
    isFias === false &&
    (record.CODE.substring(record.CODE.length - 2) === '00' ||
    record.CODE.substring(record.CODE.length - 2) === '51' ||
    record.CODE.substring(record.CODE.length - 2) === '99');
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
    if (record.CODE.substring(record.CODE.length - 2) === '51') {
      data.isNotActual = true;
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
