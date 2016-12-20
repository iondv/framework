/**
 * Created by kras on 22.08.16.
 */
var fs = require('fs');
var path = require('path');
const appDeployer = require('./appSetup');
var read = require('lib/config-reader');

module.exports = function (appDir) {
  return new Promise(function (resolve, reject) {
    console.log('Установка приложения ' + appDir);
    var dep = null;
    var depPath = path.join(appDir, 'deploy.json');
    try {
      fs.accessSync(depPath);
      dep = read(JSON.parse(fs.readFileSync(depPath)), appDir);
    } catch (err) {
      console.warn('Не удалось прочитать конфигурацию развертывания.');
    }

    var worker;
    if (dep) {
      if (dep.deployer) {
        if (dep.deployer === 'built-in') {
          worker = function () {
            return appDeployer(dep);
          };
        } else {
          worker = require(dep.deployer);
        }
        if (typeof worker === 'function') {
          console.log('Выполняется скрипт развертывания приложения');
          worker().then(function () { resolve(dep); }).catch(reject);
          return;
        }
      }
    }
    resolve(dep);
  });
};
