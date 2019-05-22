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
function SettingsRepository() {

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

    const reader = fn =>
      read(path.join(appsPath, fn))
        .then((config) => {
          if (config.globals && typeof config.globals === 'object')
            setParams(null, config.globals);

          if (config.modules && typeof config.modules === 'object') {
            Object.keys(config.modules).forEach((module) => {
              setParams(module, config.modules[module]);
            });
          }
        });

    fs.readdir(appsPath, {withFileTypes: true}, (err, files) => {
      if (!err) {
        files.forEach((f) => {
          if (typeof f == 'string') {
            p = p
              .then(() => new Promise((resolve, reject) => {
                fs.stat(path.join(appsPath, f), (err, fstat) => err ? reject(err) : resolve(fstat.isDirectory()));
              }))
              .then(isDir => isDir ? reader(f) : null);
          } else if (f.isDirectory()) {
            p = p.then(() => reader(f.name));
          }
        });
      }
    });
    return p;
  };
}

SettingsRepository.prototype = new ISettingsRepository();
module.exports = SettingsRepository;
