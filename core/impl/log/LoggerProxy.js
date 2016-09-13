/**
 * Created by kras on 20.07.16.
 */

var Logger = require('core/interfaces/Logger');

function LoggerProxy() {
  /**
   * @param {String} message
   */
  this._info = function (message) {
  };

  /**
   * @param {String} message
   */
  this._log = function (message) {
  };

  /**
   * @param {String} message
   */
  this._warn = function (message) {
  };

  /**
   * @param {String} message
   */
  this._error = function (message) {
  };
}

LoggerProxy.prototype = new Logger();

module.exports = LoggerProxy;
