/**
 * Тестируем проверку соответствия файлов меты формату JSON
 */

'use strict';

const path = require('path');

const processDir = require('core/util/read').processDir;

describe('# Проверка соответствия файлов метаданных форматам', function () {
  this.timeout(120000);
  const pathApp = path.join(__dirname, '../../applications');
  it('Проверка соответствия формату JSON в ' + pathApp, (done) => {
    let filesList = [];
    processDir(pathApp,
      (nm) => {return nm.substr(-5) === '.json';},
      (fn) => {filesList.push(fn);},
      (err) => {console.error('Ошибка считывания файлов', err);});
    let errFiles = [];
    filesList.forEach((fn) => {
      try {
        require(fn);
      } catch (err) {
        errFiles.push(fn);
        console.error('Ошибка в', err.message);
      }
    });
    if (errFiles.length) {
      done(new Error ('В файлах метаданных и данных ошибка в формате JSON'));
    } else {
      console.info('Проверенно JSON файлов', filesList.length);
      done();
    }

  });
});
