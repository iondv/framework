/**
 * Created by kras on 18.08.16.
 */

var di = require('core/di');
var fs = require('fs');

function smartMerge(old, val) {
  if (typeof old === typeof val) {
    if (old && typeof old === 'object') {
      if (Array.isArray(old)) {
        if (Array.isArray(val)) {
          for (var i = 0; i < val.length; i++) {
            if (old.indexOf(val[i]) < 0) {
              old.push(val[i]);
            }
          }
        } else {
          old.push(val);
        }
      } else {
        for (var nm in val) {
          if (val.hasOwnProperty(nm)) {
            old[nm] = smartMerge(old.hasOwnProperty(nm) ? old[nm] : undefined, val[nm]);
          }
        }
      }
      return old;
    }
  }
  return val;
}

/**
 * @param {SettingsRepository} settings
 * @param {String} module
 * @param {{}} globals
 * @returns {Promise}
 */
function setGlobals(settings, module, globals) {
  return new Promise(function (resolve, reject) {
    var old, snm;
    try {
      for (var nm in globals) {
        if (globals.hasOwnProperty(nm)) {
          snm = (module ? module + '.' : '') + nm;
          old = settings.get(snm);
          if (typeof old === 'object' && typeof globals[nm] === 'object') {
            old = smartMerge(old, globals[nm]);
          } else {
            old = globals[nm];
          }
          settings.set(snm, old);
        }
      }
      settings.apply().then(resolve).catch(reject);
    } catch (err) {
      reject(err);
    }
  });
}

function moduleSetup(settings, module, config) {
  return new Promise(function (resolve, reject) {
    setGlobals(settings, module, config.globals || {}).
    then(function () {
      fs.access('modules/' + module + '/setup', fs.R_OK, function (err) {
        if (!err) {
          var setup = require('modules/' + module + '/setup');
          setup(config).then(resolve).catch(reject);
          return;
        } else {
          resolve();
        }
      });
    }).catch(reject);
  });
}

module.exports = function (config) {
  /**
   * @type {SettingsRepository}
   */
  var settings = di.context('app').settings;

  return new Promise(function (resolve, reject) {
    var workers = [];
    if (typeof config.globals === 'object') {
      workers.push(setGlobals(settings, null, config.globals));
    }
    if (typeof config.modules === 'object') {
      for (var module in config.modules) {
        if (config.modules.hasOwnProperty(module)) {
          workers.push(moduleSetup(settings, module, config.modules[module]));
        }
      }
    }
    Promise.all(workers).then(resolve).catch(reject);
  });
};
