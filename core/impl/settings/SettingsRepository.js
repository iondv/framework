/* eslint-disable valid-jsdoc, require-jsdoc, no-underscore-dangle, object-curly-newline, no-prototype-builtins */
/* eslint-disable valid-jsdoc, require-jsdoc, no-underscore-dangle, object-curly-newline, no-prototype-builtins, id-length, id-match */
const smartMerge = require('./util/merge-configs');
const ISettingsRepository = require('core/interfaces/SettingsRepository');
const read = require('core/readAppDeployConfig');
const path = require('path');
const fs = require('fs');

/**
 * @param {{dataSource: DataSource, logger: Logger}} opts
 * @constructor
 */
function SettingsRepository(opts) {
  const registry = {};

  this._set = (nm, value, options) => {
    const {merge} = (options === true) ? {} : options || {};
    registry[nm] = merge ? smartMerge(registry[nm], value, options) : value;
  };

  this._get = (nm) => {
    if (registry.hasOwnProperty(nm))
      return registry[nm];
    return null;
  };

  this._apply = () => Promise.resolve();

  /**
   * @returns {Promise}
   */
  this._reset = () => Promise.resolve();

  function setParams(mod, globals) {
    for (const nm in globals) {
      if (globals.hasOwnProperty(nm)) {
        const snm = (mod ? `${mod}.` : '') + nm;
        registry[snm] = smartMerge(registry[snm], globals[nm]);
      }
    }
  }

  function reader(fn) {
    return read(fn)
      .then((config) => {
        if (config.globals && typeof config.globals === 'object')
          setParams(null, config.globals);

        if (config.modules && typeof config.modules === 'object') {
          Object.keys(config.modules).forEach((mod) => {
            setParams(mod, config.modules[mod].globals);
          });
        }
      })
      .catch(err => opts.logger.error(err));
  }

  this._init = () => {
    const appsPath = path.normalize(path.join(__dirname, '..', '..', '..', 'applications'));
    return new Promise((resolve, reject) => {
      fs.readdir(appsPath, {withFileTypes: true}, (err, files) => {
        if (err)
          return reject(err);
        let p = Promise.resolve();
        files.forEach((f) => {
          if (typeof f === 'string') {
            p = p
              .then(() => new Promise((rs, rj) => {
                fs.stat(path.join(appsPath, f), (err2, fstat) => {
                  if (err2)
                    return rj(err2);
                  return rs(fstat.isDirectory() ? f : null);
                });
              }))
              .then(() => reader(path.join(appsPath, f)));
          } else if (f.isDirectory()) {
            p = p.then(() => reader(path.join(appsPath, f.name)));
          }
        });
        return p.then(() => resolve()).catch(reject);
      });
    });
  };
}

SettingsRepository.prototype = new ISettingsRepository();
module.exports = SettingsRepository;
