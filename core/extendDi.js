/**
 * Created by kras on 29.09.16.
 */
'use strict';
const di = require('./di');
const extend = require('extend');

/**
 * @param {String | null} moduleName
 * @param {{}} config
 * @param {{}} [rootScope]
 * @returns {*}
 */
module.exports = function (moduleName, config, rootScope) {
  if (!rootScope) {
    /**
     * @type {{settings: SettingsRepository}}
     */
    rootScope = di.context('app');
  }

  if (rootScope.settings) {
    let name = moduleName ? `${moduleName}.di` : 'di';
    let extDi = rootScope.settings.get(name);
    if (extDi) {
      return extend(true, config, extDi);
    }
  }
  return config;
};
