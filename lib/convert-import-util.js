// Уточняем параметры jsHint.
// maxcomplexity - цикломатическая сложность функций разбора по типам 12, а не 10ть из-за архитектуры и упрощения чтения
// jshint maxcomplexity: 12

'use strict';

var fs = require('fs');
var path = require('path');

var assert = require('assert');

const saveData = process.env.IMPORT ? process.env.IMPORT.indexOf('DONTSAVE') !== -1 ? false : true : true;
console.log('Статус сохранения данных', saveData);

/**
 * Сохранение файлов
 * @param {Object} importedData - объект с данными импорта
 * @param {Object} importedData.meta - структура метаданных, наименование объекта - класс с неймспейсом: adminTerritory@khv-svyaz-info
 * @param {Object} importedData.result  - именованный массивом объектов - имя с названием класса, значения - массив данных импорта
 * @returns {Promise}
 */
function saveImportedFiles(importedData) {
  let metaData = importedData.meta;
  let dataToSave = importedData.result;
  return new Promise(function (resolve, reject) {
    try {
      let qntSavedObject = 0;
      for (let className in dataToSave) {
        if (dataToSave.hasOwnProperty(className)) {
          for (let j = 0; j < dataToSave[className].length; j++) {
            let nameFile = setObjectFileName(className, metaData[className], dataToSave[className][j]);
            let verifiedIndex = verifyRequireValue(className, metaData[className], dataToSave[className][j]);
            if (!verifiedIndex) {
              nameFile += '.err';
            }
            try {
              let fullFileName = path.join(importedData.pathData, nameFile);
              let objData = dataToSave[className][j];
              /* Реализация проверки существования файла и обновление его - работает ДОЛГО
               // console.info('Сохраняем', fullFileNam);
               try {
                fs.accessSync(fullFileName, fs.constants.F_OK); // Если файл есть, считываем и обновляем
                let previousObjData = require(fullFileName);
                updateImportedObject(previousObjData, objData, ['_class', '_classVer'], nameFile);
                console.log('Обновлен объект данных', nameFile);
              } catch (e) {

              } finally { // Если файла нет, просто сохраняем
                fs.writeFileSync(fullFileName, JSON.stringify(objData, null, 2), 'utf8');
              }*/
              if (saveData) {
                fs.writeFileSync(fullFileName, JSON.stringify(objData, null, 2), 'utf8');
              }
              delete dataToSave[className][j]; // Очищаем память занимаемую объектом
              qntSavedObject++;
            } catch (e) {
              console.error('Ошибка записи класса', className, 'путь', importedData.pathData, 'файл', nameFile + '\n' + e);
              reject(e);
            }
          }
        }
      }
      // Удаляем пустые элементы в массиве, чтобы оптимизировать использование памяти
      for (let className in dataToSave) {
        if (dataToSave.hasOwnProperty(className)) {
          importedData.result[className] = dataToSave[className].filter(function (value) {
            return value ? true : false;
          });
        }
      }
      resolve(qntSavedObject);
    } catch (e) {
      console.error('Ошибка верификации данных для записи', e);
      reject(e);
    }
  });
}
module.exports.saveImportedFiles = saveImportedFiles;

/**
 * Функция обновления объектов
 * @param {Object} updatedObject обновляемый объект
 * @param {Object} importedObject - объект, которым обновляем
 * @param {Array} ignoreKeys - игнорируемые ключи объекта
 * @param {String} className - имя класса обновляемого объекта
 * @returns {Object} updatedObject обновленный объект
 */
function updateImportedObject(updatedObject, importedObject, ignoreKeys, className) {
  if (!ignoreKeys) {
    ignoreKeys = [];
  }
  if (!className) {
    className = 'объекта';
  }
  if (typeof updatedObject !== 'undefined') {
    for (let key in importedObject) {
      if (importedObject.hasOwnProperty(key)) {
        if (typeof updatedObject[key] !== 'undefined') {
          if (ignoreKeys.indexOf(key) === -1 && updatedObject[key] !== importedObject[key]) {
            if (Array.isArray(importedObject[key])) {
              for (let i = 0; i < importedObject[key].length; i++) {
                if (updatedObject[key].indexOf(importedObject[key][i]) === -1) {
                  updatedObject[key].push(importedObject[key][i]);
                }
              }
            } else {
              /* 4debug console.log('При обновлении %s с id %s, заменяем для ключа %s значение "%s" на новое значение "%s"',
                className, importedObject.id, key, updatedObject[key], importedObject[key]);*/
              updatedObject[key] = importedObject[key];
            }
          }
        } else {
          updatedObject[key] = importedObject[key];
        }
      }
    }
  } else {
    console.warn('Осутствует обновляемый объект', className, importedObject);
    updatedObject = importedObject;
  }
  return updatedObject;
}
module.exports.updateImportedObject = updateImportedObject;

/**
 * Фуцнкция формирования имени файла
 * @param {Object} className - название класса
 * @param {Object} metaData - метаданные класса
 * @param {Object} dataToConvert - объект с данными для конвертации
 * @return {String} fileName - имя файла для сохранения
 */
function setObjectFileName(className, metaData, dataToConvert) {
  let idFromKey = '';
  if (!metaData) {

    console.warn('Пропущена формирование id для объекта класса %s, т.к отсутствет мета.' +
      ' Будет пропуск id значения в имени файла', className);
    return className + '@' + idFromKey + '.json';
  } else {
    metaData.key.forEach((item) => {
      idFromKey += dataToConvert[item];
    });
    return className + '@' + idFromKey + '.json';
  }

}

/**
 * Функция верификации обязательного наличия полей с ключами и обязательными индексами
 * @param {String} className - имя класса
 * @param {Object} metaData - метаданные класса
 * @param {Object} dataItemToConvert массивом объектов с названием класса и данными (массиов) импорта
 */
function verifyRequireValue(className, metaData, dataItemToConvert) {
  // При уточнении вывода ошибки индекса const ERR_STR_VAL = '!!!ОШИБШКА!!!, незаполненное обязательное поле';
  if (!metaData) {
    console.warn('Пропущена проверка для объекта класса %s, т.к отсутствет мета', className);
    return false;
  } else {
    let keysInData = metaData.key.filter(function (keyItem) {
      return dataItemToConvert[keyItem]; // CHEKME может нужна большая проверка, что ключ не пустой, у него длина больше 1го и т.д.
    });
    let verifyRes = 0;
    verifyRes = keysInData.length === metaData.key.length ? verifyRes | 0 : verifyRes | 1; // 1 = 0001
    let indexKey = '';
    if (metaData.compositeIndexes) {
      metaData._indexValue = metaData._indexValue ? metaData._indexValue : [];
      metaData.compositeIndexes.forEach(function (indexItem, i) {
        metaData._indexValue[i] = metaData._indexValue[i] ? metaData._indexValue[i] : [];
        if (indexItem.unique && indexItem.properties.length) { // Составной индекс должен быть уникальным?
          indexItem.properties.forEach(function (propIndexItem) {
            if (!dataItemToConvert[propIndexItem]) { // Если значение отсутствует
              for (let j = 0; j < metaData.properties.length; j++) {
                if (metaData.properties[j].name === propIndexItem && !metaData.properties[j].nullable) {
                  if (metaData.properties[j].type === 13 || metaData.properties[j].type === 14) {
                    console.info('  У объекта ' + dataItemToConvert[metaData.key[0]] + ' класса ' + className +
                      ' отсутствует значение в индексном поле тип 13/14 ' + propIndexItem);
                  } else {
                    // Есди надо устанавливать ошибку dataItemToConvert[propIndexItem] = metaData.properties[j].type === 0 ? ERR_STR_VAL : null;
                    console.info('  У объекта ' + dataItemToConvert[metaData.key[0]] + ' класса ' + className +
                      ' отсутствует значение в индексном поле ' + propIndexItem); // Для вывода установленного значения ошибки + '. Установлено ' + dataItemToConvert[propIndexItem]
                  }
                  break;
                }
              }
            }
            indexKey += dataItemToConvert[propIndexItem];
          });
          if (metaData._indexValue[i][indexKey]) {
            if (metaData._indexValue[i][indexKey].search(dataItemToConvert[metaData.key[0]]) !== -1) {
              verifyRes = verifyRes | 2; // 2 == 0010
              console.warn('  Дублирование индекса', indexKey, 'объекта c id', dataItemToConvert[metaData.key[0]],
                'класса', className, 'уже записан объекты c id', metaData._indexValue[i][indexKey]);
              metaData._indexValue[i][indexKey] += ',' + dataItemToConvert[metaData.key[0]];
            }
          } else {
            metaData._indexValue[i][indexKey] = dataItemToConvert[metaData.key[0]];
          }
        }
      });
    }
    // Провека на обязательные элементы из ionDataRepository function checkRequired
    let lazy = false;
    for (let i = 0; i < metaData.properties.length; i++) {
      if (metaData.properties[i].type !== 14 && // Если не коллекции
        !metaData.properties[i].nullable &&
        (lazy && dataItemToConvert.hasOwnProperty(metaData.properties[i].name) &&
          dataItemToConvert[metaData.properties[i].name] === null ||
          !lazy && !metaData.properties[i].autoassigned  &&
          (!dataItemToConvert.hasOwnProperty(metaData.properties[i].name) ||
          dataItemToConvert[metaData.properties[i].name] === null)
        )) {
        verifyRes = verifyRes | 4; // 4 == 0100
        console.warn('  Нет обязательного значения в поле', metaData.properties[i].name,
          'объекта', dataItemToConvert[metaData.key[0]], 'класса', className);
      }
    }
    let util = require('util');
    const keyErr = 'Объект c ключем ' + metaData.key[0] + ' значение ' + dataItemToConvert[metaData.key[0]] +
      ' класса ' + className + ' отсутствует непустое значение ключа. Попущен, значение ' +
      util.inspect(dataItemToConvert, {depth: 1});
    const indexErr = 'Объект c ключем ' + metaData.key[0] + ' значение ' +  dataItemToConvert[metaData.key[0]] +
      ' класса ' + className + ' дублируется непустое значение индекса. Попущен'  +
      util.inspect(dataItemToConvert, {depth: 1});
    const reqErr = 'Объект c ключем ' + metaData.key[0] + ' значение ' + dataItemToConvert[metaData.key[0]] +
      ' класса ' + className + ' отсутствует обязательное значение. Попущен, значение ' +
      util.inspect(dataItemToConvert, {depth: 1});

    switch (verifyRes) {
      case 1: // 0001 - Ошибка в ключе
        console.warn(keyErr);
        return false;
      case 2: // 0010 - Ошибка в индексе
        console.warn(indexErr);
        return false;
      case 3: // 0011 Ошибка в ключе и индексе
        console.warn(keyErr, '\n', indexErr);
        return false;
      case 4: // 0100 Ошибка в обязательности
        console.warn(reqErr);
        return false;
      case 5: // 0101 Ошибка в обязательности и ключе
        console.warn(reqErr, '\n', keyErr);
        return false;
      case 6: // 0110 Ошибка в обязательности и индексе
        console.warn(reqErr, '\n', indexErr);
        return false;
      case 7: // 0111 Ошибка в обязательности, ключе и индексе
        console.warn(reqErr, '\n', keyErr, '\n', indexErr);
        return false;
      default: // Значение 0 - нет ошибок
        return true;
    }
  }
}

/**
 * Функция получения всех json файлов в папке импорта портала
 * @param {String} metaFolder  - путь к папке с метаданными
 * @returns {Promise}
 */
function getMetaClassFiles(metaFolder) {
  return new Promise(function (resolve, reject) {
    try {
      getDirAndFilesList(metaFolder, {recurse: true,
          type: 'files',
          regexpFilesMask: new RegExp('.*[.](json$).*$', 'i')},
        function (err, initFilesList) {
          console.info('В папке %s найдено %s файлов классов меты', metaFolder, initFilesList.files.length);
          let metaData = readMetaFiles(initFilesList);
          resolve(metaData);
        });
    } catch (e) {
      console.error('Ошибка определения списка папок с метой для конвертации', metaFolder + ':', e);
      reject(e);
    }
  });
}

/**
 * Функция фильтрации файлов находящихся только в папках метаданных
 * @param {Object} metaFilesList  - объект с массивом со списком файлов с полным путем
 * @param {Array} metaFilesList.files  - массивом со списком файлов с полным путем
 * @returns {Promise}
 */
function readMetaFiles(metaFilesList) {
  return new Promise(function (resolve, reject) {
    try {
      let metaData = [];
      let qntInitFiles = metaFilesList.files.length;
      for (var i = 0; i < qntInitFiles; i++) {
        try {
          let metaDirName = path.dirname(metaFilesList.files[i]);
          if (path.basename(metaDirName) === 'meta') {
            let nameSpace = path.basename(path.join(metaDirName, '..'));
            let metaFile = require(metaFilesList.files[i]);
            metaData[metaFile.name + '@' + nameSpace] = metaFile;
          } else {
            throw new Error('Не может быть определен неймспейс для файла ' + metaFilesList.files[i] +
              ', файл не в папке meta');
          }
        } catch (e) {
          console.error('Ошибка считывания файла', metaFilesList.files[i] + '\n' + e);
          reject(e);
        }
      }
      resolve(metaData);
    } catch (e) {
      console.error('Ошибка формирования массива меты', e);
      reject(e);
    }
  });
}

module.exports.getMetaClassFiles = getMetaClassFiles;

/**
 * Функция проверки объекта с именами как ключи и массивом фио, где в элементе массива
 * @param {Object} noSexNames
 * @param {String} noSexNames.surname
 * @param {String} noSexNames.patronomic
 * @param {String} noSexNames.fio
 * @returns {{man: Array, woman: Array, notCheked: {}}}
 */
function checkSex(noSexNames) {
  let sexres = {man: {}, woman: {}, notCheked: {}};
  for (let name in noSexNames) {
    if (noSexNames.hasOwnProperty(name)) {
      let woman = 0;
      let man = 0;
      for (let i = 0; i < noSexNames[name].length; i++) {
        let pers = noSexNames[name][i];
        let pSurL = pers.surname.length;
        let lastSurChar = pers.surname[pSurL - 1];
        let lastSur2Char = pers.surname.substr(pSurL - 2);
        let lastSur3Char = pers.surname.substr(pSurL - 3);

        if (lastSur3Char === 'ова' || lastSur3Char === 'ева' || lastSur3Char === 'ина' || lastSur2Char === 'яя' ||
          lastSur2Char === 'ая') {
          woman++;
        }
        if (lastSur2Char === 'ов' || lastSur2Char === 'ой' || lastSur2Char === 'ев' || lastSur2Char === 'ин') {
          man++;
        }
        if (pers.patronymic) {
          let pPatL = pers.patronymic.length;
          let lastPatChar = pers.patronymic[pPatL - 1];
          let lastPat2Char = pers.patronymic.substr(pPatL - 2);
          let lastPat3Char = pers.patronymic.substr(pPatL - 3);
          let lastPat4Char = pers.patronymic.substr(pPatL - 4);
          if (lastPat4Char === 'овна' || lastPat4Char === 'евна') {
            woman++;
          }
          if (lastPat2Char === 'ич') {
            man++;
          }
        }
      }
      noSexNames[name].push({woman: woman, man: man});
      if (woman === man) {
        if (sexres.notCheked[name]) {
          sexres.notCheked[name] = [];
        }
        sexres.notCheked[name] = noSexNames[name];
      } else if (woman > man) {
        if (sexres.woman[name]) {
          sexres.woman[name] = [];
        }
        sexres.woman[name] = noSexNames[name];
      } else {
        if (sexres.man[name]) {
          sexres.man[name] = [];
        }
        sexres.man[name] = noSexNames[name];
      }
    }
  }

  return sexres;
}

module.exports.checkSex = checkSex;

/**
 * Функция получения справочников необходимых для импорта, без переноса их на сохранение
 * @param {Object} importedData - объект с данными импорта
 * @param {Object} importedData.meta - структура метаданных, наименование объекта - класс с неймспейсом: adminTerritory@khv-svyaz-info
 * @param {Object} importedData.import - объект с импортируемыми данными, где имена свойств имена исходных файлов
 * @param {Object} importedData.reference - обюъект с массивами объектов справочников в формате JSON, где имя свойства - имя класса с неймспоейсом: adminTerritory@khv-svyaz-info
 * @param {Array} importedData.result  - массивом объектов с названием класса и данными (массиов) импорта
 * @param {String} importedData.result[].className - имя класса  с неймспейсом: adminTerritory@khv-svyaz-info
 * @param {Array} importedData.result[].data - результирующий массив объектов
 * @returns {Promise}
 */
function getBeforeReference(importedData) {
  let importedReference = importedData.reference;
  return new Promise(function (resolve, reject) {
    try {
      for (let importClassName in importedReference) {
        if (importedReference.hasOwnProperty(importClassName)) {
          if (!importedData.result[importClassName]) {
            importedData.result[importClassName] = [];
          }
          if (!importedData.meta[importClassName]) {
            console.warn('Нет меты для класса %s. Невозможно импортировать значения справочников.', importClassName);
          } else {
            for (let i = 0; i < importedReference[importClassName].length; i++) {
              let foundedExistingObj = false;
              importedData.result[importClassName].forEach((existingObj) => { // Проверяем, что такого объекта нет, по значениям ключевого поля
                let classKeyName = importedData.meta[importClassName].key[0]; // TODO на массив ключей
                if (existingObj[classKeyName] === importedReference[importClassName][i][classKeyName]) {
                  foundedExistingObj = true;
                }
              });
              if (!foundedExistingObj) {
                importedData.result[importClassName].push(importedReference[importClassName][i]);
              }
            }
          }
        }
      }
      resolve(importedData);
    } catch (e) {
      console.error('Ошибка дополнения новыми данными для импорта', e);
      reject(e);
    }
  });
}

module.exports.getBeforeReference = getBeforeReference;

/**
 * Функция считыватния дополнительных объектов для импорта
 * @param {Object} importedData - объект с данными импорта
 * @param {Object} importedData.meta - структура метаданных, наименование объекта - класс с неймспейсом: adminTerritory@khv-svyaz-info
 * @param {Object} importedData.import - объект с импортируемыми данными, где имена свойств имена исходных файлов
 * @param {Object} importedData.reference - обюъект с массивами объектов справочников в формате JSON, где имя свойства - имя класса с неймспоейсом: adminTerritory@khv-svyaz-info
 * @param {Array} importedData.result  - массивом объектов с названием класса и данными (массиов) импорта
 * @param {String} importedData.result[].className - имя класса  с неймспейсом: adminTerritory@khv-svyaz-info
 * @param {Array} importedData.result[].data - результирующий массив объектов
 * @returns {Promise}
 */
function importReference(importedData) {
  let importedReference = importedData.reference;
  return new Promise(function (resolve, reject) {
    try {
      for (let importClassName in importedReference) {
        if (importedReference.hasOwnProperty(importClassName)) {
          if (!importedData.result[importClassName]) {
            importedData.result[importClassName] = [];
          }
          if (!importedData.meta[importClassName]) {
            console.warn('Нет меты для класса %s. Невозможно импортировать значения справочников.', importClassName);
          } else {
            for (let i = 0; i < importedReference[importClassName].length; i++) {
              let foundedExistingObj = false;
              importedData.result[importClassName].forEach((existingObj) => { // Проверяем, что такого объекта нет, по значениям ключевого поля
                let classKeyName = importedData.meta[importClassName].key[0]; // TODO на массив ключей
                if (existingObj[classKeyName] === importedReference[importClassName][i][classKeyName]) {
                  foundedExistingObj = true;
                }
              });
              if (!foundedExistingObj) {
                importedData.result[importClassName].push(importedReference[importClassName][i]);
              }
            }
          }
        }
      }
      resolve(importedData);
    } catch (e) {
      console.error('Ошибка дополнения новыми данными для импорта', e);
      reject(e);
    }
  });
}

module.exports.importReference = importReference;

/**
 * Функция вывода объема используемой приложением памяти, каждые интервал значений
 * @param {Number} qntValue - значение количества добавленных в память записей
 */
function intervalMemoryCheck(qntValue) {
  const infoInterval = 10;
  if (qntValue / infoInterval === Math.round(qntValue / infoInterval)) { // Показываем только каждый интервал добавленных данных
    console.info('(!)Использование памяти на новые %s объектов:', infoInterval, infoMemory());
  }
}
module.exports.intervalMemoryCheck = intervalMemoryCheck;

/**
 * Функция вывода объема используемой приложением памяти
 * @returns {String} - информация о памяти
 */
function infoMemory() {
  let mem = process.memoryUsage();
  return 'rss ' + mem.rss + ' heapTotal ' + mem.heapTotal + ' heapUsed ' + mem.heapUsed;
}
module.exports.infoMemory = infoMemory;

/**
 * Функция генерации ГУИД
 * @returns {String} - GUID
 */
function generateGUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    let r = Math.random() * 16 | 0;
    let v = c === 'x' ? r : r & 0x3 | 0x8;
    return v.toString(16);
  });
}

module.exports.generateGUID = generateGUID;

/*
 * Функция получения списка файлов и дирректорий, по параметрам
 * param = {
 *   recurse: true | false или цифра // рекурсивный поиск, или только в директории назначения.
 *                                // Цифра - глубинра поиска. По умолчанию только в дирректории
 *   type: files, dir, full // результат со списком файлов, дирректории или полный. По умолчанию полный.
 *   regexpFilesMask: '' - строка с regexp выражением, для отбора файлов. По умолчанию все файлы
 * }
 * result = {
 *   dir = [],
 *   files = []
 * }
 */
function getDirAndFilesList(pathInitDataFolder, param, done) {
  if (typeof pathInitDataFolder === 'function' && typeof param === 'undefined') {
    done = pathInitDataFolder;
    pathInitDataFolder = __dirname;
    param = {
      recurse: false,
      type: 'full'
    };
  } else if (typeof param === 'function' && typeof done === 'undefined') {
    done = param;
    param = {
      recurse: false,
      type: 'full'
    };
  }
  var RECURSE = param.recurse ? true : false;
  var GET_DIR = param.type === 'dir' || param.type === 'full' ? true : false;
  var GET_FILES = param.type === 'files' || param.type === 'full' ? true : false;
  var FILES_MASK = param.regexpFilesMask || null;
  var results = {
    dir: [],
    files: []
  };
  var pending;
  var recurseRuns = 0;
  var recurseParam;

  try {
    fs.readdir(pathInitDataFolder, function (err, list) {
      try {
        assert.equal(err, null);// 'При чтении структуры дирректорий произошла ошибка: ' + err.message);
        pending = list.length;
        if (!pending) {
          done(null, results); // Можно возвращать другой тип, например false - но тогда проверки могут не работать
        }
        list.forEach(function (file) {
          file = path.resolve(pathInitDataFolder, file);
          fs.stat(file, function (err, stat) {
            try {
              assert.equal(err, null);// 'При получении данных файла произошла ошибка');
              if (stat.isDirectory()) {
                if (GET_DIR) {
                  results.dir.push(file);
                }
                if (RECURSE) {
                  recurseRuns++; // Увеличиваем, т.к. уменьшается не дожидаясь выполнения вложенной функции
                  if (typeof param.recurse === 'number' && param.recurse > 0) {
                    recurseParam = param.recurse - 1;
                  } else {
                    recurseParam = param.recurse;
                  }
                  getDirAndFilesList(file, {
                      recurse: recurseParam,
                      type: param.type,
                      regexpFilesMask: param.regexpFilesMask
                    },
                    function (err, res) {
                      if (err) {
                        done(err); // При ошибка будет несколько раз вызывать калбэк, надо отлавливать.
                      } else {
                        results.dir = results.dir.concat(res.dir);
                        results.files = results.files.concat(res.files);
                        recurseRuns--;
                        if (!pending && !recurseRuns) {
                          done(null, results);
                        }
                      }
                    });
                }
              } else if (stat.isFile()) {
                if (GET_FILES) {
                  if (FILES_MASK) {
                    if (file.search(FILES_MASK) !== -1) {
                      results.files.push(file);
                    }
                  } else {
                    results.files.push(file);
                  }
                }
              }
            } finally {
              pending--;
              if (!pending && !recurseRuns) {
                done(null, results);
              }
            }
          });
        });
      } catch (err) {
        done(err);
      }
    });
  } catch (err) {
    done(err);
  }
}

module.exports.getDirAndFilesList = getDirAndFilesList;
