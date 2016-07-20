// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
/**
 * Created by kras on 20.07.16.
 */

var Logger = require('core/interfaces/Logger');
var moment = require('moment');
var FileStreamRotator = require('file-stream-rotator');
var fs = require('fs');
var path = require('path');

function IonLogger(options) {
  var prefix = options.prefix || '';
  var logDestinations = options.logDestinations || ['console'];
  var infoDestinations = options.infoDestinations || logDestinations;
  var warnDestinations = options.warnDestinations || infoDestinations;
  var errDestinations = options.errDestinations || warnDestinations;

  var streams = {};

  logDestinations = parseDest(logDestinations, 'log');
  infoDestinations = parseDest(infoDestinations, 'info');
  warnDestinations = parseDest(warnDestinations, 'warn');
  errDestinations = parseDest(errDestinations, 'err');

  function parseDest(dest, type) {
    var stat;
    var result = [];
    for (var i = 0; i < dest.length; i++) {
      if (dest[i] === 'console' ||
        typeof dest[i] === 'object' &&
        (dest[i] instanceof Logger || typeof dest[i].write === 'function')) {
        result.push(dest[i]);
      } else if (typeof dest[i] === 'string' && dest[i] !== 'console') {
        if (!streams.hasOwnProperty(dest[i])) {
          try {
            stat = fs.statSync(dest[i]);
            if (stat.isDirectory()) {
              result.push(FileStreamRotator.getStream({
                filename: path.join(dest[i], type + '-%DATE%.log'),
                frequency: 'daily',
                verbose: false,
                date_format: 'YYYY-MM-DD'
              }));
            } else if (stat.isFile()) {
              result.push(fs.createWriteStream(dest[i], {encoding: 'utf-8'}));
            }
          } catch (err) {
          }
        } else {
          result.push(streams[dest[i]]);
        }
      }
    }
    return result;
  }

  function writeToDest(dest, message, type, consoleMethod) {
    var d = moment().format('DD.MM HH:mm');
    for (var i = 0; i < dest.length; i++) {
      if (dest[i] === 'console') {
        consoleMethod.call(console, d + ' ' + prefix + ' ' + message);
      } else if (typeof dest[i].info === 'function') {
        dest[i].info(prefix + ' ' + message);
      } else if (typeof dest[i].write === 'function') {
        dest[i].write(d + ' ' + type + ' ' + prefix + ' ' + message + '\r\n');
      }
    }
  }

  /**
   * @param {String} message
   */
  this._info = function (message) {
    writeToDest(infoDestinations, message, 'INFO', console.info);
  };

  /**
   * @param {String} message
   */
  this._log = function (message) {
    writeToDest(logDestinations, message, 'LOG', console.log);
  };

  /**
   * @param {String} message
   */
  this._warn = function (message) {
    writeToDest(warnDestinations, message, 'WARN', console.warn);
  };

  /**
   * @param {String} message
   */
  this._error = function (message) {
    writeToDest(errDestinations, message, 'ERROR', console.error);
  };
}

IonLogger.prototype = new Logger();

module.exports = IonLogger;
