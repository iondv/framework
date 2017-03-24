/**
 * Created by kras on 06.10.16.
 */
'use strict';
const Logger = require('core/interfaces/Logger');

/**
 * @param {{}} options
 * @param {IonLogger} options.target
 * @param {String[]} options.messageTypes
 * @constructor
 */
function LogRecorder(options) {

  var recording = false;

  var buf = [];

  if (options && options.target) {
    options.target.addDestination(this, options.messageTypes || []);
  }

  this.start = function () {
    recording = true;
  };

  this.stop = function () {
    recording = false;
    var result = buf;
    buf = [];
    return result;
  };

  /**
   * @param {String} message
   */
  this._info = function (message) {
    if (recording) {
      buf.push({type: 'info', message: message});
    }
  };

  /**
   * @param {String} message
   */
  this._log = function (message) {
    if (recording) {
      buf.push({type: 'log', message: message});
    }
  };

  /**
   * @param {String} message
   */
  this._warn = function (message) {
    if (recording) {
      buf.push({type: 'warn', message: message});
    }
  };

  /**
   * @param {String} message
   */
  this._error = function (message) {
    if (recording) {
      buf.push({type: 'error', message: message});
    }
  };
}

LogRecorder.prototype = new Logger();

module.exports = LogRecorder;
