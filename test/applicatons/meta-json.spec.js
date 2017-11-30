/**
 * Тестируем проверку соответствия файлов меты формату JSON
 */

'use strict';

// Уточняем параметры jsHint.
// expr - убрать предупреждение для функций без (): expect(...).to.have.been.called или expect(...).to.be.ok
// maxstatements - множественные describe/it/expect одного уровня в одной группе describe или it
// jshint expr: true, maxstatements:20

const path = require('path');

const processDir = require('core/util/read').processDir;

describe('# Проверка соответствия файлов метаданных форматам', function () {
  this.timeout(120000);
  it('Проверка соответствия формату JSON', (done) => {
    let filesList = [];
    processDir(path.join(__dirname, '../../applications'),
      (nm) => {return nm.substr(-5) === '.json';},
      (fn) => {filesList.push(fn);},
      (err) => {console.error('Ошибка считывания файлов', err);});
    let errFiles = [];
    filesList.forEach((fn) => {
      try {
        let temp = require(fn);
      } catch (err) {
        errFiles.push(fn);
        console.error('Ошибка в файле %s\n', fn, err.message);
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
