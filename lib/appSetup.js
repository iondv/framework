/* eslint-disable valid-jsdoc, require-jsdoc, no-prototype-builtins, no-shadow */
/**
 * Created by kras on 18.08.16.
 */

const fs = require('fs');
const path = require('path');
const merge = require('merge');

/**
 * @param {SettingsRepository} settings
 * @param {String} module
 * @param {{}} globals
 * @returns {Promise}
 */
function setGlobals(settings, module, globals, options) {
  for (const nm in globals) {
    if (globals.hasOwnProperty(nm)) {
      const snm = (module ? `${module}.` : '') + nm;
      settings.set(snm, globals[nm], merge({merge: true}, options || {}));
    }
  }
  return settings.apply();
}

function moduleSetup(settings, module, config, options) {
  return setGlobals(settings, module, config.globals || {}, options).then(() => {
    const pth = path.resolve(path.join(__dirname, '..'), path.join('modules', module, 'setup'));
    return new Promise((resolve, reject) => {
      fs.access(pth, fs.R_OK, (err) => {
        if (err)
          return resolve();

        const setup = require(pth);
        return setup(config)
          .then(resolve)
          .catch(reject);
      });
    });
  });
}

/**
 * @param {{}} config
 * @param {{}} options
 * @param {SettingsRepository} options.settings
 * @param {Boolean} [options.overrideArrays]
 * @param {Boolean} [options.resetSettings]
 * @param {Boolean} [options.preserveModifiedSettings]
 * @returns {Promise.<T>}
 */
module.exports = (config, options) => {
  options = options || {};

  /**
   * @type {SettingsRepository}
   */
  const settings = options.settings;

  let workers = Promise.resolve();

  if (options.resetSettings)
    workers = workers.then(() => settings.reset(options.preserveModifiedSettings));

  if (config.globals && typeof config.globals === 'object')
    workers = workers.then(() => setGlobals(settings, null, config.globals, options));

  if (config.modules && typeof config.modules === 'object') {
    Object.keys(config.modules).forEach((module) => {
      workers = workers.then(() => moduleSetup(settings, module, config.modules[module], options));
    });
  }

  return workers;
};
