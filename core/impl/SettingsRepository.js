/**
 * Created by kras on 18.08.16.
 */

/**
 * @param {{dataSource: DataSource}} options
 * @constructor
 */
function SettingsRepository(options) {

  var registry = {};

  var changed = {};

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
    var writers = [];
    for (var nm in changed) {
      if (changed.hasOwnProperty(nm)) {
        writers.push(options.dataSource.upsert('ion_global_settings', {name: nm}, {value: registry[nm]}));
      }
    }
    changed = {};
    return Promise.all(writers);
  };

  this.init = function () {
    return new Promise(function (resolve, reject) {
      options.dataSource.ensureIndex('ion_global_settings', [{name: 1}], {unique: true}).
      then(
        function () {
          return options.dataSource.fetch('ion_global_settings');
        }
      ).then(
        function (settings) {
          for (var i = 0; i < settings.length; i++) {
            registry[settings[i].name] = settings[i].value;
          }
          resolve();
        }
      ).catch(reject);
    });
  };
}

module.exports = SettingsRepository;
