/**
 * Created by akumidv on 21.09.2016.
 * Конвертор версий метаданных
 */

// Уточняем параметры jsHint.
// maxcomplexity - цикломатическая сложность функций разбора по типам 12, а не 10ть из-за архитектуры и упрощения чтения
// jshint maxcomplexity: 12, maxstatements: 25

'use strict';

var util = require('util');

const metaVersion = require('lib/meta-update/meta-version');
var transfMD = require('lib/meta-update/transformation');

var fs = require('fs');
var path = require('path');
var assert = require('assert');

const pathToApp = path.join(__dirname, '..', 'applications'); // При запуске из bin

console.log('Путь к приложениям', pathToApp);

console.time('metaConv');
getListOfAppliactionsMetaFiles(pathToApp)
  .then(createMetaAppWithMetaFilesList)
  .then(readMetaFiles)
  .then(convertMetaVersion)
  // .then(writeMetaFiles)
  .then((metaApp) => {
    console.timeEnd('metaConv');
    console.log('Конвертация закончена');
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
 * @returns {Promise} с объектом metaApp
 * {Object} metaApp - объект метаданных приложения
 * {Object} metaApp.meta - именованный массив объектов с метой и представлениями классов, имя - класс
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
 * {Object} metaApp.meta[].vwList - представление списка
 * {Object} metaApp.meta[].vwList.text - представление списка текст
 * {Object} metaApp.meta[].vwList.obj - представление списка объект
 * {Object} metaApp.meta[].vwList.fileName - представление списка имя файла
 * {Object} metaApp.navigation - именованный массив объектос с навигацией, имя - секция
 * {Object} metaApp.navigation[].section - объект секции
 * {Object} metaApp.navigation[].section.text - текстовые файлы навигации
 * {Object} metaApp.navigation[].section.obj - распарсеныые JSON файлы навигации
 * {Object} metaApp.navigation[].section.fileName - путь к файлу секции
 * {Object} metaApp.navigation[].menu - именованный маасив значений меню секции, имя код меню
 * {Object} metaApp.navigation[].menu[].text - текстовое значение файла меню
 * {Object} metaApp.navigation[].menu[].obj - распарсернный файл меню
 * {Object} metaApp.navigation[].menu[].fileName - путь к файлу меню
 */
function createMetaAppWithMetaFilesList(listFilesInMetadataFolders) {
  return new Promise(function (resolve, reject) {
    try {
      let metaApp = {meta: {}, navigation: {}};
      let pathParsing;
      let metaPathFolder;
      let metaFolders;
      for (let i = 0; i < listFilesInMetadataFolders.files.length; i++) {
        pathParsing = path.parse(listFilesInMetadataFolders.files[i]); // Вытаскиваем дирректорию в пути
        metaPathFolder = pathParsing.dir.slice(pathToApp.length); // Обрезаем общие пути в метаданных
        metaFolders = metaPathFolder.split(path.sep); // Определям состав папок - нулевой элемент пустой, т.к. начало директории со слеша, первый содержит папку метаданных, второй папки внутри метаданных
        let className = metaFolders[1] + '@'; // Задайем префикс неймспейса у класса
        switch (metaFolders[2]){
          case 'meta':
            className += path.basename(listFilesInMetadataFolders.files[i], '.class.json');
            metaApp.meta[className] = metaApp.meta[className] ? metaApp.meta[className] :
                                                                {cls: {}, vwCreate: {}, vwItem: {}, vwList: {}};
            metaApp.meta[className].cls.fileName = listFilesInMetadataFolders.files[i];
            break;
          case 'views':
            className += metaFolders[3];
            metaApp.meta[className] = metaApp.meta[className] ? metaApp.meta[className] :
                                                                {cls: {}, vwCreate: {}, vwItem: {}, vwList: {}};
            switch (path.basename(listFilesInMetadataFolders.files[i], '.json')) {
              case 'create':
                metaApp.meta[className].vwCreate.fileName = listFilesInMetadataFolders.files[i];
                break;
              case 'item':
                metaApp.meta[className].vwItem.fileName = listFilesInMetadataFolders.files[i];
                break;
              case 'list':
                metaApp.meta[className].vwList.fileName = listFilesInMetadataFolders.files[i];
                break;
              default:
                console.error('Неожиданный тип представления %s в названии файла %s',
                  path.basename(listFilesInMetadataFolders.files[i], '.json'), listFilesInMetadataFolders.files[i]);
            }
            break;
          case 'navigation':
            let sectionName = metaFolders[1] + '@'; // Задайем префикс неймспейса у секции
            if (!metaFolders[3]) { // Анализ - секция или папка с меню
              sectionName += path.basename(listFilesInMetadataFolders.files[i], '.section.json');
              metaApp.navigation[sectionName] = metaApp.navigation[sectionName] ? metaApp.navigation[sectionName] :
                                                                                  {section: {}, menu: {}};
              metaApp.navigation[sectionName].section.fileName = listFilesInMetadataFolders.files[i];
            } else {
              sectionName += metaFolders[3];
              metaApp.navigation[sectionName] = metaApp.navigation[sectionName] ? metaApp.navigation[sectionName] :
                                                                                  {section: {}, menu: {}};
              let menuCode = path.basename(listFilesInMetadataFolders.files[i], '.json');
              metaApp.navigation[sectionName].menu[menuCode] = metaApp.navigation[sectionName].menu[menuCode] ?
                                                                  metaApp.navigation[sectionName].menu[menuCode] : {};
              metaApp.navigation[sectionName].menu[menuCode].fileName = listFilesInMetadataFolders.files[i];
            }

            break;
          default:
        }

      }

      resolve(metaApp);
    } catch (e) {
      console.error('Ошибка выделения списка файлов меты в прилжоениях ', e);
      reject(e);
    }
  });
}

/*
 * Функция поиска атрибута filename, счтиывания файла и присваивания его атрибуту text
 * в соответствии со структурой metaApp
 * @param structureOfMeta
 **/
function searchFileNameAndRead(structureOfMeta) {
  for (let key in structureOfMeta) {
    if (structureOfMeta.hasOwnProperty (key)) {
      if (key === 'fileName') {
        try {
          structureOfMeta.text = fs.readFileSync(structureOfMeta.fileName, 'utf8');// Если сразу парсить require(convertFilesList[i]);
        } catch (e) {
          throw e;
        }
      } else if (key !== 'text' && key !== 'obj') {
        searchFileNameAndRead(structureOfMeta[key]);
      }
    }
  }
}

/**
 * Считывание содержимого файлов
 * @param {Object} metaApp - объект метаданных приложения
 * @returns {Promise}
 */
function readMetaFiles(metaApp) {
  return new Promise(function (resolve, reject) {
    try {
      searchFileNameAndRead(metaApp);
    } catch (e) {
      console.error('Ошибка считывания файла\n' + e);
      reject(e);
    }
    resolve(metaApp);
  });
}

/*
 * Функция запуска конвертаций меты по версиям
 * @param {Object} metaApp - объект метаданных приложения
 * @returns {Promise}
 **/
function convertMetaVersion(metaApp) {
  return new Promise(function (resolve, reject) {
    let versionOrder = [];
    try {
      metaVersion.forEach((metaItem) => {
        if (metaItem.version) {
          let semVer = metaItem.version.split('.');
          console.log('semVer', semVer);
          versionOrder.push({ver: metaItem.version,
                              semVer: metaItem.version.split('.'),
                              functionName: metaItem.transformateMetaDataFunctionName,
                              tranformateObj: metaItem});
        }
      });
      // TODO реализовать сортировку версий
      versionOrder.forEach((item) => {
        // TODO все компоненты текст замена, конвертация и замена объектов, обратная конвертация в текст
        if (transfMD[item.functionName]) {
          transfMD[item.functionName]({metaApp});
        }
      });

    } catch (e) {
      console.error('Ошибка конвертации меты\n' + e);
      reject(e);
    }
    // console.log(util.inspect(metaApp,  {showHidden: true, depth: 3}));
    console.log('Версии меты', versionOrder);
    resolve(metaApp);
  });
}

/*
 * Функция поиска атрибута filename, и сохранения значения файла из атрибута атрибута text
 * в соответствии со структурой metaApp
 * @param structureOfMeta
 **/
function searchFileNameAndWrite(structureOfMeta) {
  for (let key in structureOfMeta) {
    if (structureOfMeta.hasOwnProperty (key)) {
      if (key === 'fileName') {
        try {
          if (structureOfMeta.text) {
            let pathParsing = path.parse(structureOfMeta.fileName); // Вытаскиваем дирректорию в пути
            let metaPathFolder = pathParsing.dir.slice(pathToApp.length); // Обрезаем общие пути в метаданных
            let name = path.join('c:\\temp\\test', metaPathFolder, pathParsing.base + '.0');
            fs.writeFileSync(name, structureOfMeta.text, 'utf8');
          }
        } catch (e) {
          throw e;
        }
      } else if (key !== 'text' && key !== 'obj') {
        searchFileNameAndWrite(structureOfMeta[key]);
      }
    }
  }
}

/**
 * Сохранение содержимого файлов
 * @param {Object} metaApp - объект метаданных приложения
 * @returns {Promise}
 */
function writeMetaFiles(metaApp) {
  return new Promise(function (resolve, reject) {
    try {
      searchFileNameAndWrite(metaApp);
    } catch (e) {
      console.error('Ошибка записи файла\n' + e);
      reject(e);
    }
    resolve(metaApp);
  });
}

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
