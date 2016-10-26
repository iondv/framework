/**
 * Created by akumidv on 21.09.2016.
 * Конвертор версий метаданных
 */

// Уточняем параметры jsHint.
// maxcomplexity - цикломатическая сложность функций разбора по типам 12, а не 10ть из-за архитектуры и упрощения чтения
// jshint maxcomplexity: 12

'use strict';

const metaVersion = require('lib/meta-update/meta-version');
var TransfMD = require('lib/meta-update/transformation');

var fs = require('fs');
var path = require('path');
var assert = require('assert');

const pathToApp = path.join(__dirname, '..', 'applications'); // При запуске из bin
var metaData;

console.log('Путь к приложениям', pathToApp);

TransfMD.verR2F0P0({});



getListOfAppliactionsMetaFiles(pathToApp)
  .then(fixListToMetaFilesOnly)
  .then(readMetaFiles)
//  .then(convertToCamelCase)
//  .then(saveConvertFiles)
  .then((res) => {
    console.log('Кол-во сконвертированных файлов', res);
  })
  .catch((err)=> {
    throw err;
  });

/**
 * Функция получения всех json файлов в папке метаданных
 * @param {String} folderOfApp  - путь к папке с приложениями
 * @returns {Promise}
 */
function getListOfAppliactionsMetaFiles(folderOfApp) {
  return new Promise(function (resolve, reject) {
    try {
      getDirAndFilesList(folderOfApp, {recurse: true,
        type: 'files',
        regexpFilesMask: new RegExp('.*[.](json$).*$', 'i')}, function (err, metaList) {
        resolve(metaList);
      });
    } catch (e) {
      console.error('Ошибка определения списка папок приложений с метой для конвертации', folderOfApp + ':', e);
      reject(e);
    }
  });
}

/**
 * Функция фильтрации файлов находящихся только в папках метаданных
 * @param {Object} listFilesInMetadataFolders  - объект с массивом со списком файлов с полным путем
 * @param {Array} listFilesInMetadataFolders.files  - массивом со списком файлов с полным путем
 * @returns {Promise}
 */
function fixListToMetaFilesOnly(listFilesInMetadataFolders) {
  return new Promise(function (resolve, reject) {
    try {
      let listFiles = [];
      let pathParsing;
      let metaPathFolder;
      let metaFolders;
      // 2del let pushedFiles = 0;
      for (let i = 0; i < listFilesInMetadataFolders.files.length; i++) {
        pathParsing = path.parse(listFilesInMetadataFolders.files[i]); // Вытаскиваем дирректорию в пути
        metaPathFolder = pathParsing.dir.slice(pathToApp.length); // Обрезаем общие пути в метаданных
        metaFolders = metaPathFolder.split(path.sep); // Определям состав папок - нулевой элемент пустой, т.к. начало директории со слеша, первый содержит папку метаданных, третий папки внутри метаданных
        if (metaFolders[2] === 'meta' || metaFolders[2] === 'navigation' || metaFolders[2] === 'views') { // TODO нужно добавить ворклфлоу???
          listFiles.push(listFilesInMetadataFolders.files[i]);
        }
      }
      resolve(listFiles);
    } catch (e) {
      console.error('Ошибка выделения списка файлов меты в прилжоениях ', e);
      reject(e);
    }
  });
}

/**
 * Считывание содержимого файлов
 * @param {Array} fixedFilesList  - массивом со списком файлов метаданных с полными путями
 * @returns {Promise} с объектом metaData
 * {Object} metaApp - объект метаданных приложения
 * {Array} metaApp.meta - массив объектов с метой и представлениями классов //TODO возможно все же не массив, а объект с именем класса или секций и тд.
 * {Object} metaApp.meta[].cls - класс меты
 * {Object} metaApp.meta[].cls.text - текстовое значение файла класса
 * {Object} metaApp.meta[].cls.obj - распарсенное значение файла класса
 * {Object} metaApp.meta[].cls.fileName- путь к классу
 * {Object} metaApp.meta[].vwCreate - объект представления создания
 * {Object} metaApp.meta[].vwCreate.text - представление создания
 * {Object} metaApp.meta[].vwCreate.obj - представление создания
 * {Object} metaApp.meta[].vwCreate.fileName - представление создания
 * {Object} metaApp.meta[].vwItem - объект представление формы
 * {Object} metaApp.meta[].vwItem.text - представление формы
 * {Object} metaApp.meta[].vwItem.obj - представление формы
 * {Object} metaApp.meta[].vwItem.fileName. - представление формы
 * {Object} metaApp.meta[].vwList.text - представление списка
 * {Object} metaApp.meta[].vwList.obj - представление списка
 * {Object} metaApp.meta[].vwList.fileName. - представление списка
 * {Object} metaApp.navigation - массив объектос с навигацией
 * {Object} metaApp.navigation[].section - объект секции
 * {Object} metaApp.navigation[].section.text - текстовые файлы навигации
 * {Object} metaApp.navigation[].section.obj - распарсеныые JSON файлы навигации
 * {Object} metaApp.navigation[].section.fileName - путь к файлу секции
 * {Array} metaApp.navigation[].menu - маасив значений меню секции
 * {Object} metaApp.navigation[].menu[].text - текстовое значение файла меню
 * {Object} metaApp.navigation[].menu[].obj - распарсернный файл меню
 * {Object} metaApp.navigation[].menu[].fileName - путь к файлу меню
 */
function readMetaFiles(fixedFilesList) {
  return new Promise(function (resolve, reject) {
    let metaApp = []; // TODO {meta: [], navigation: []}
    for (var i = 0; i <  fixedFilesList.length; i++) {
      try {
        let metaFile = fs.readFileSync(fixedFilesList[i]);// Если сразу парсить require(convertFilesList[i]); // TODO metaApp
        metaApp.push({fileName: fixedFilesList[i], data: metaFile.toString()});
      } catch (e) {
        console.error('Ошибка считывания файла', fixedFilesList[i] + '\n' + e);
        reject(e);
      }
    }
    resolve(metaApp);
  });
}

/**
 * Функция фильтрации файлов находящихся только в папках метаданных
 * @param {Array} metaData - массивом с объектами меты
 * @param {String} metaData.fileName  - имя файла меты
 * @param {Object} metaData.data  - данные меты
 * @returns {Promise}
 */
/*function saveConvertFiles(metaData) {
  return new Promise(function (resolve, reject) {
    let qntSavedObject = 0;
    for (var i = 0; i < metaData.length; i++) {
      try {
        fs.writeFileSync(metaData[i].fileName, metaData[i].data, 'utf8'); // Если JSON JSON.stringify(metaData[i].data, null, 2)
        console.log('Сконвертирован и записан файл', metaData[i].fileName);
        qntSavedObject++;
      } catch (e) {
        console.error('Ошибка записи меты', metaData[i].fileName + '\n' + e);
        reject(e);
      }
    }
    resolve(qntSavedObject);
  });
}*/

/**
 * Функция конвертации файлов метаданных в которых содержатся JSON объекты со свойствами в формате order_number в формат orderNumber
 * @param {Array} metaData - массивом с объектами меты
 * @param {String} metaData.fileName  - имя файла меты
 * @param {Object} metaData.data  - данные меты
 * @returns {Promise}
 */
/*function convertToCamelCase(metaData) {
  return new Promise(function (resolve, reject) {

    // TODO сделать считывание файла, парсинг его, перебор всех свойств, если свойство содержит символ '_' склеивать, первые буквы после символа '_' делать заглавными
    // TODO Альтернатива - иметь набор текстовых строк для замены через regexp - тогда считывание файлов, строковые замены, запись файла
    for (var i = 0; i < metaData.length; i++) {
      try {
        metaStringsTooReplace.forEach((replaceItem) => {
          metaData[i].data = metaData[i].data.replace(replaceItem[0], replaceItem[1]);
        });
      } catch (e) {
        console.error('Ошибка конвертации данных меты', metaData[i].fileName + '\n' + e);
        reject(e);
      }
    }
    resolve(metaData);
  });
}*/

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
