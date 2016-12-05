/**
 * Created by akumidv on 24.08.2016.
 * Конвертор импорта портала в файлы импорта платформы
 */

// Уточняем параметры jsHint.
// maxcomplexity - цикломатическая сложность функций разбора по типам 12, а не 10ть из-за архитектуры и упрощения чтения
// jshint maxcomplexity: 12

'use strict';

var fs = require('fs');
var path = require('path');

const getMetaData = require('lib/convert-import-util').getMetaClassFiles;
const saveImportedFiles = require('lib/convert-import-util').saveImportedFiles;
const importReference = require('lib/convert-import-util').importReference;
const getBeforeReference = require('lib/convert-import-util').getBeforeReference;

let appPath = getAppDir();
console.log('Импортируемые приложения', appPath.toString());


Promise.all(appPath.map(importApplications))
  .then((res) => {
    console.info('Выполнен импорт', res);
  })
  .catch((err)=> {
    console.error(err);
  });

function importApplications(appPathItem) {
  return new Promise(function (resolve, reject) {
    const importedBeforeReference = require(path.join(appPathItem, 'convert-import-app')).importedBeforeReference;
    const importedAfterReference = require(path.join(appPathItem, 'convert-import-app')).importedAfterReference;
    const importedFolders = require(path.join(appPathItem, 'convert-import-app')).importedFolders;
    const getImportedFiles = require(path.join(appPathItem, 'convert-import-app')).getImportedFiles;
    const convertImportedFiles = require(path.join(appPathItem, 'convert-import-app')).convertImportedFiles;

    console.log('Импортируемые папки', importedFolders.toString());

    const pathToData = path.join(appPathItem, 'data');
    if (!fs.existsSync(pathToData)) {
      fs.mkdirSync(pathToData);
    }
    const pathToMeta = path.join(appPathItem, 'meta');
    getMetaData(pathToMeta)
      .then(
        /**
         * Функция формирования importedData
         * @param {Object}res - классы метаданных приложения
         * @returns {Object} importedData - объект с данными импорта
         * @returns {Object} importedData.meta - структура метаданных, наименование объекта - класс с неймспейсом: adminTerritory@khv-svyaz-info
         * @returns {Object} importedData.parsed - объект с импортируемыми данными, где имена свойств имена исходных файлов
         * @returns {Object} importedData.path - путь к папкам импортируемых данных
         * @returns {Object} importedData.verify - объект с ключевыми данными верификации уникальности и связи объектов
         * @returns {Object} importedData.reference - обюъект с массивами объектов справочников в формате JSON, где имя свойства - имя класса с неймспоейсом: adminTerritory@khv-svyaz-info
         * @returns {Object} importedData.result  - именованный массивом объектов - имя с названием класса, значения - массив данных импорта
         */
        function (res) {
          console.info('Считали мету, импортируем данные приложения', appPathItem);
          let importedData = {meta: res, parsed: {}, verify: {},
            reference: importedBeforeReference, result: {}};  // Сформировали объект импорта
          return importedData;
        })
      .then(getBeforeReference)
      .then((importedData) => {
        function importAppBase(importPath, callback) {
          let importedPath = path.join(appPathItem, importPath);
          importedData.path = importedPath;
          getImportedFiles(importedData, importedPath)
          // 4debug
          // .then((importedData) => {
          //   console.log('Конвертируем распарсенные объекты из папки', importedPath);
          //   return importedData;
          // })
            .then(convertImportedFiles)
            .then((importedData) => {
              delete importedData.parsed;
              importedData.path = '';
              //importedData.result = [];
              //importedData.result = [];
              // console.log('##Распарсенный импорт\n', importedData.parsed);
              // console.log('##Результат', importedData.result);
              return importedData;
            })
            .then(saveImportedFiles)
            // 4debug
            .then((qntSaved) => {
              console.log('Сохранили и очистили память после импорта папки', importedPath);
              callback(null,qntSaved);
            })
            .catch((err)=> {
              callback(err);
            });
        }

        function importIterator(importedFolders, i, callback) {
          if (i === importedFolders.length) {
            callback (null);
          } else {
            console.log('Импортируем БД', importedFolders[i]);
            importAppBase(importedFolders[i], (err, qntSaved) => {
              console.log('Закончили импорт БД, сохранено', importedFolders[i], qntSaved);
              if (err) {
                callback (err);
              } else {
                i++;
                importIterator(importedFolders, i, callback);
              }
            });
          }
        }
        return new Promise(function (resolve,reject) {
          importIterator(importedFolders, 0, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve (importedData);
            }
          });
        });
      })
      .then((importedData) => {
        // console.log('###Верификация', Object.keys(importedData.verify).length, '\n', importedData.verify);
        console.log('###Верификация person@khv-childzem', Object.keys(importedData.verify['person@khv-childzem']).length);
        return importedData;
      })
      .then((importedData) => { // Добавляем справочники, которые были не нужны для импорта
        for (let key in importedAfterReference) {
          if (importedAfterReference.hasOwnProperty(key)) {
            if (!importedData.reference[key]) {
              importedData.reference[key] = [];
            }
            importedData.reference[key] = importedData.reference[key].concat(importedAfterReference[key]);
          }
        }
        return importedData;
      })
      .then(importReference) // Переводим справочники для сохранения
      .then((importedData) => {
        delete importedData.reference; // Может бесполезно их уже удалять
        return importedData;
      })
      .then(saveImportedFiles) // TODO нужно после пересохранять, обновленные объекты verify и заодно
      .then((res) => {
        resolve(appPathItem);
      })
      .catch((err)=> {
        reject(err);
      });

  });
}

// Получение списка приложений
function getAppDir() {
  try {
    let apps = path.join(__dirname, '..', 'applications');
    fs.accessSync(apps, fs.constants.F_OK);
    let files = fs.readdirSync(apps);
    let appsPath = [];
    for (let i = 0; i < files.length; i++) {
      let fn = path.join(apps, files[i]);
      let stat = fs.lstatSync(fn);
      if (stat.isDirectory()) {
        try {
          fs.accessSync(path.join(fn, 'convert-import-app.js'), fs.constants.F_OK);
          appsPath.push(fn);
        } catch (e) {
          console.info('Отсутствует файл конвертации, пропущено конвертация и иимпорт приложения', fn);
        }

      }
    }
    return appsPath;
  } catch (e) {
    console.warn('Отсутствует дирректория приложений applications');
  }
}


