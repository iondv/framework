/* eslint-disable valid-jsdoc, require-jsdoc, no-underscore-dangle */
/**
 * Created by krasilneg on 25.04.19.
 */

/**
 * @constructor
 */
function SettingsRepository() {
  /**
   * @param {String} nm
   * @param {*} value
   * @param {{}} options
   */
  this.set = function (nm, value, options) {
    this._set(nm, value, options);
  };

  this.get = function (nm) {
    return this._get(nm);
  };

  this.apply = function () {
    return this._apply();
  };

  /**
   * @param {Boolean} preserveImportant
   * @returns {Promise}
   */
  this.reset = function (preserveImportant) {
    return this._reset(preserveImportant);
  };

  this.init = function () {
    return this._init();
  };
}

module.exports = SettingsRepository;
