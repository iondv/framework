'use strict';
/**
 * Created by kras on 18.08.16.
 */
const F = require('core/FunctionCodes');
/**
 * @param {{dataSource: DataSource}} options
 * @constructor
 */
function SettingsRepository(options) {

  let registry = {};

  let changed = {};

  let important = {};

  this.set = function (nm, value, markImportant) {
    if (markImportant || !important[nm]) {
      registry[nm] = value;
      changed[nm] = true;
      if (markImportant) {
        important[nm] = true;
      }
    }
  };

  this.get = function (nm) {
    if (registry.hasOwnProperty(nm)) {
      return registry[nm];
    }
    return null;
  };

  this.apply = function () {
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
  this.reset = function (preserveImportant = false) {
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

  this.init = function () {
    return options.dataSource.ensureIndex('ion_global_settings', [{name: 1}], {unique: true})
      .then(() => options.dataSource.fetch('ion_global_settings'))
      .then(
        (settings) => {
          settings.forEach((s) => {
            registry[s.name] = s.value;
            if (s.important) {
              important[s.name] = true;
            }
          });
        }
      );
  };
}

module.exports = SettingsRepository;
