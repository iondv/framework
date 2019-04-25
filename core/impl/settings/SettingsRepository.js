/* eslint-disable valid-jsdoc, require-jsdoc, no-underscore-dangle, object-curly-newline, no-prototype-builtins, id-length */
const smartMerge = require('./util/merge-configs');
const ISettingsRepository = require('core/interfaces/SettingsRepository');
const read = require('core/readAppDeployConfig');
const path = require('path');
const fs = require('fs');

/**
 * @param {{dataSource: DataSource}} options
 * @constructor
 */
function SettingsRepository(options) {

  let registry = {};

  this._set = function (nm, value, options) {
    const {merge} = (options === true) ? {} : options || {};
    registry[nm] = merge ? smartMerge(registry[nm], value, options) : value;
  };

  this._get = function (nm) {
    if (registry.hasOwnProperty(nm)) {
      return registry[nm];
    }
    return null;
  };

  this._apply = function () {
    return Promise.resolve();
  };

  /**
   * @param {Boolean} preserveImportant
   * @returns {Promise}
   */
  this._reset = function () {
    return Promise.resolve();
  };

  function setParams(module, globals) {
    for (const nm in globals) {
      if (globals.hasOwnProperty(nm)) {
        const snm = (module ? `${module}.` : '') + nm;
        registry[snm] = smartMerge(registry[snm], globals[nm]);
      }
    }
  }

  this._init = function () {
    let p = Promise.resolve();
    let appsPath = path.normalize(path.join(__dirname, '..', '..', '..', 'applications'));
    fs.readdir(appsPath, {withFileTypes: true}, (err, files) => {
      if (!err) {
        files.forEach((f) => {
          if (f.isDirectory()) {
            p = p
              .then(() => read(path.join(appsPath, f.name)))
              .then((config) => {
                if (config.globals && typeof config.globals === 'object')
                  setParams(null, config.globals);

                if (config.modules && typeof config.modules === 'object') {
                  Object.keys(config.modules).forEach((module) => {
                    setParams(module, config.modules[module]);
                  });
                }
              });
          }
        });
      }
    });
    return p;
  };
}

SettingsRepository.prototype = new ISettingsRepository();
module.exports = SettingsRepository;
