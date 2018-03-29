/**
 * Created by kras on 18.08.16.
 */
'use strict';

const di = require('core/di');
const fs = require('fs');
const path = require('path');

function array_unique(arr) {
  let tmp = [];
  return arr.filter(
    (e)=>{
      let se = typeof e === 'object' ? JSON.stringify(e) : e;
      if (tmp.indexOf(se) >= 0) {
        return false;
      }
      tmp.push(se);
      return true;
    });
}

/**
 * @param {*} old
 * @param {*} val
 * @param {{}} [options]
 * @param {Boolean} [options.overrideArrays]
 * @returns {*}
 */
function smartMerge(old, val, options) {
  if (typeof old === typeof val) {
    if (old && typeof old === 'object') {
      if (Array.isArray(old)) {
        if (options && options.overrideArrays) {
          return val;
        }

        if (Array.isArray(val)) {
          for (let i = 0; i < val.length; i++) {
            if (old.indexOf(val[i]) < 0) {
              old.push(val[i]);
            }
          }
        } else {
          old.push(val);
        }
        let tmp = array_unique(old);
        old.splice(0, old.length);
        old.push(...tmp);
      } else {
        for (let nm in val) {
          if (val.hasOwnProperty(nm)) {
            old[nm] = smartMerge(old.hasOwnProperty(nm) ? old[nm] : undefined, val[nm], options);
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
function setGlobals(settings, module, globals, options) {
  for (let nm in globals) {
    if (globals.hasOwnProperty(nm)) {
      let snm = (module ? module + '.' : '') + nm;
      let old = settings.get(snm);
      if (typeof old === 'object' && typeof globals[nm] === 'object') {
        old = smartMerge(old, globals[nm], options);
      } else {
        old = globals[nm];
      }
      settings.set(snm, old);
    }
  }
  return settings.apply();
}

function moduleSetup(settings, module, config, options) {
  return setGlobals(settings, module, config.globals || {}, options).then(() => {
    let pth = path.resolve(path.join(__dirname, '..'), path.join('modules', module, 'setup'));
    return new Promise((resolve, reject) => {
      fs.access(pth, fs.R_OK, function (err) {
        if (!err) {
          let setup = require(pth);
          setup(config).then(resolve).catch(reject);
          return;
        } else {
          resolve();
        }
      });
      });
  });
}

/**
 * @param {{}} config
 * @param {{}} [options]
 * @param {Boolean} [options.overrideArrays]
 * @param {Boolean} [options.resetSettings]
 * @param {Boolean} [options.preserveModifiedSettings]
 * @returns {Promise.<T>}
 */
module.exports = function (config, options) {
  options = options || {};

  /**
   * @type {SettingsRepository}
   */
  let settings = di.context('app').settings;

  let workers = Promise.resolve();

  if (options.resetSettings) {
    workers = workers.then(() => settings.reset(options.preserveModifiedSettings));
  }

  if (typeof config.globals === 'object') {
    workers = workers.then(() => setGlobals(settings, null, config.globals, options));
  }
  if (typeof config.modules === 'object') {
    Object.keys(config.modules).forEach((module) => {
      workers = workers.then(() => moduleSetup(settings, module, config.modules[module], options));
    });
  }
  return workers;
};
