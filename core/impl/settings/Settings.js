/* eslint-disable valid-jsdoc, require-jsdoc, no-underscore-dangle, object-curly-newline, no-prototype-builtins, id-length */
/**
 * Created by krasilneg on 25.04.19.
 */

const ISettingsRepository = require('core/interfaces/SettingsRepository');

/**
 * @param {{dataSource: DataSource}} options
 * @constructor
 */
function Settings(options) {

  var worker;

  this._set = function (nm, value, options) {
    worker.set(nm, value, options);
  };

  this._get = function (nm) {
    return worker.get(nm);
  };

  this._apply = function () {
    return worker.apply();
  };

  /**
   * @param {Boolean} preserveImportant
   * @returns {Promise}
   */
  this._reset = function () {
    return worker.reset();
  };

  this._init = function () {
    const mode = options.mode || 'files';
    const RepoClass = (mode === 'db') ?
      require('core/impl/settings/DsSettingsRepository') :
      require('core/impl/settings/SettingsRepository');
    worker = new RepoClass(options);
    return worker.init();
  };
}

Settings.prototype = new ISettingsRepository();
module.exports = Settings;
