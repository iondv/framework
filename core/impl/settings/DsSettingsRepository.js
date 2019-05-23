/* eslint-disable valid-jsdoc, require-jsdoc, no-underscore-dangle, object-curly-newline, no-prototype-builtins, id-length */
/**
 * Created by kras on 18.08.16.
 */
const F = require('core/FunctionCodes');
const smartMerge = require('./util/merge-configs');
const ISettingsRepository = require('core/interfaces/SettingsRepository');
/**
 * @param {{dataSource: DataSource}} options
 * @constructor
 */
function DsSettingsRepository(options) {
  let registry = {};

  let changed = {};

  let important = {};

  this._set = function (nm, value, opts) {
    const {markImportant, merge} = (opts === true) ? {markImportant: true} : opts || {};
    if (markImportant || !important[nm]) {
      registry[nm] = merge ? smartMerge(registry[nm], value, opts) : value;
      changed[nm] = true;
      if (markImportant) {
        important[nm] = true;
      }
    }
  };

  this._get = function (nm) {
    if (registry.hasOwnProperty(nm)) {
      return registry[nm];
    }
    return null;
  };

  this._apply = function () {
    let writers = Promise.resolve();
    Object.keys(changed).forEach((nm) => {
      writers = writers.then(() => {
        let v = {value: registry[nm]};
        if (important.hasOwnProperty(nm) && important[nm]) {
          v.important = true;
        }
        return options.dataSource.upsert('ion_global_settings', {[F.EQUAL]: ['$name', nm]}, v);
      });
    });
    return writers.then((r) => {
      changed = {};
      return r;
    });
  };

  /**
   * @param {Boolean} preserveImportant
   * @returns {Promise}
   */
  this._reset = function (preserveImportant = false) {
    let f = {};
    if (preserveImportant) {
      f = {[F.NOT_EQUAL]: ['$important', true]};
    }
    return options.dataSource.delete('ion_global_settings', f)
      .then(() => options.dataSource.fetch('ion_global_settings'))
      .then((settings) => {
        registry = {};
        important = {};
        settings.forEach((s) => {
          registry[s.name] = s.value;
          if (s.important) {
            important[s.name] = true;
          }
        });
      });
  };

  this._init = function () {
    return options.dataSource.ensureIndex('ion_global_settings', [{name: 1}], {unique: true})
      .then(() => options.dataSource.fetch('ion_global_settings'))
      .then((settings) => {
        settings.forEach((s) => {
          registry[s.name] = s.value;
          if (s.important)
            important[s.name] = true;
        });
      });
  };
}

DsSettingsRepository.prototype = new ISettingsRepository();
module.exports = DsSettingsRepository;
