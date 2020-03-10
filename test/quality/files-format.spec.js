/**
 * Тестируем проверку соответствия файлов меты формату JSON
 */
const path = require('path');

const processDir = require('core/util/read').processDir;

describe('# Проверка соответствия файлов метаданных форматам', function () {
  this.timeout(120000);
  const pathApp = path.join(__dirname, '../../applications');
  it('Проверка соответствия формату JSON в ' + pathApp, (done) => {
    let filesList = [];
    let errFiles = [];
    processDir(pathApp,
      (nm) => {return nm.substr(-5) === '.json';},
      (fn) => {if (fn.indexOf('node_modules') === -1) {
        filesList.push(fn);
        try {
          require(fn);
        } catch (err) {
          errFiles.push(fn);
          console.error('Ошибка в', err.message);
        }
      }},
      (err) => {console.error('Ошибка считывания файлов', err);});
    if (errFiles.length) {
      done(new Error ('В файлах метаданных и данных ошибка в формате JSON'));
    } else {
      console.info('Проверенно JSON файлов', filesList.length);
      done();
    }
  });
});
