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
    registry[nm] = value;
    changed[nm] = true;
    if (markImportant) {
      important[nm] = true;
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
        if (important.hasOwnProperty[nm] && important[nm]) {
          v.important = true;
        }
        return options.dataSource.upsert('ion_global_settings', {[F.EQUAL]: ['$name', nm]}, {v});
      });
    });
    changed = {};
    important = {};
    return writers;
  };

  /**
   * @param {Boolean} preserveImportant
   * @returns {Promise}
   */
  this.reset = function (preserveImportant = false) {
    let f = {};
    if (preserveImportant) {
      f = {important: {$ne: true}};
    }
    return options.dataSource.delete('ion_global_settings', f);
  };

  this.init = function () {
    return options.dataSource.ensureIndex('ion_global_settings', [{name: 1}], {unique: true}).
      then(
        () => options.dataSource.fetch('ion_global_settings')
      ).then(
        (settings) => {
          for (let i = 0; i < settings.length; i++) {
            registry[settings[i].name] = settings[i].value;
          }
          return Promise.resolve();
        }
      );
  };
}

module.exports = SettingsRepository;
