'use strict';
/**
 * Created by kras on 22.08.16.
 */
const appDeployer = require('./appSetup');
const read = require('core/readAppDeployConfig');
const {t} = require('core/i18n');
const {format} = require('util');

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
  console.log(format(t('Application %s deployment'), appDir));
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
            console.log(t('Application deployment script started'));
            return worker().then(() => dep);
          }
        }
      }
    })
    .catch(err => {
      console.warn(err);
      console.warn(t('Failed to read deployment configuration.'));
    });
};
