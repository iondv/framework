'use strict';
/**
 * Created by kras on 20.07.16.
 */

function Logger() {
  /**
   * @param {String} message
   */
  this.info = function (message) {
    this._info(message);
  };

  /**
   * @param {String} message
   */
  this.log = function (message) {
    this._log(message);
  };

  /**
   * @param {String} message
   */
  this.warn = function (message) {
    this._warn(message);
  };

  /**
   * @param {String | Error | IonError} message
   */
  this.error = function (message) {
    this._error(message);
  };
}

module.exports = Logger;
