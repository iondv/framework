'use strict';
/**
 * Created by kras on 22.08.16.
 */
const fs = require('fs');
const path = require('path');
const appDeployer = require('./appSetup');
const {readConfig} = require('core/util/read');
const read = require('lib/config-reader');

/**
 * @param {String} appDir
 * @param {{}} [options]
 * @param {Boolean} [options.overrideArrays]
 * @param {Boolean} [options.resetSettings]
 * @param {Boolean} [options.preserveModifiedSettings]
 * @returns {Promise.<*>}
 */
module.exports = function (appDir, options) {
  console.log('Установка приложения ' + appDir);
  let dep = null;
  let depPath = path.join(appDir, 'deploy.json');
  try {
    fs.accessSync(depPath);
    dep = read(readConfig(depPath), appDir);
  } catch (err) {
    console.warn('Не удалось прочитать конфигурацию развертывания.');
  }

  let worker;
  if (dep) {
    if (dep.deployer) {
      if (dep.deployer === 'built-in') {
        worker = () => appDeployer(dep, options);
      } else {
        worker = require(dep.deployer);
      }
      if (typeof worker === 'function') {
        console.log('Выполняется скрипт развертывания приложения');
        return worker().then(() => dep);
      }
    }
  }
  return Promise.resolve(dep);
};
