/**
 * Created by kras on 22.08.16.
 */
var fs = require('fs');
var path = require('path');
const appDeployer = require('./appSetup');

module.exports = function (appDir) {
  return new Promise(function (resolve, reject) {
    console.log('Установка приложения по пути ' + appDir);
    var dep = null;
    try {
      fs.accessSync(path.join(appDir, 'deploy.json'));
      dep = JSON.parse(fs.readFileSync(path.join(appDir, 'deploy.json')));
    } catch (err) {
      console.warn('Не удалось прочитать конфигурацию развертывания.');
    }

    var worker;
    if (dep) {
      if (dep.deployer) {
        if (dep.deployer === 'built-in') {
          if (typeof dep.modules === 'object') {
            worker = function () {
              return appDeployer(dep.modules);
            };
          }
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
