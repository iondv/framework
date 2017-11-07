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

  this.set = function (nm, value) {
    registry[nm] = value;
    changed[nm] = true;
  };

  this.get = function (nm) {
    if (registry.hasOwnProperty(nm)) {
      return registry[nm];
    }
    return null;
  };

  this.apply = function () {
    let writers = [];
    for (let nm in changed) {
      if (changed.hasOwnProperty(nm)) {
        writers.push(options.dataSource.upsert('ion_global_settings', {[F.EQUAL]: ['$name', nm]}, {value: registry[nm]}));
      }
    }
    changed = {};
    return Promise.all(writers);
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
