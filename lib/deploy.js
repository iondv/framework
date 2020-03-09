'use strict';
/**
 * Created by kras on 22.08.16.
 */
const appDeployer = require('./appSetup');
const read = require('core/readAppDeployConfig');

/**
 * @param {String} appDir
 * @param {{}} options
 * @param {Boolean} [options.overrideArrays]
 * @param {Boolean} [options.resetSettings]
 * @param {Boolean} [options.preserveModifiedSettings]
 * @param {SettingsRepository} options.settings
 * @returns {Promise.<*>}
 */
module.exports = function (appDir, options) {
  console.log('Установка приложения ' + appDir);
  return read(appDir)
    .then((dep) => {
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
    })
    .catch((err) => {
      console.warn(err);
      console.warn('Не удалось прочитать конфигурацию развертывания.');
    });
};
