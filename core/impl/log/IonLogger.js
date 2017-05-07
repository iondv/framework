// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
/**
 * Created by kras on 20.07.16.
 */

const Logger = require('core/interfaces/Logger');
const IonError = require('core/IonError');
const moment = require('moment');
const FileStreamRotator = require('file-stream-rotator');
const fs = require('fs');
const path = require('path');


// jshint maxcomplexity: 20

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

  /**
   * @param {Logger} logger
   * @param {String[]} types
   */
  this.addDestination = function (logger, types) {
    if (logger instanceof Logger) {
      if (!types.length) {
        infoDestinations.push(logger);
      } else {
        if (types.indexOf('log') >= 0) {
          logDestinations.push(logger);
        }
        if (types.indexOf('info') >= 0) {
          infoDestinations.push(logger);
        }
        if (types.indexOf('warn') >= 0) {
          warnDestinations.push(logger);
        }
        if (types.indexOf('err') >= 0) {
          errDestinations.push(logger);
        }
      }
    }
  };

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
            if (!fs.existsSync(dest[i])) {
              fs.mkdirSync(dest[i]);
            }

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
            console.warn(err);
          }
        } else {
          result.push(streams[dest[i]]);
        }
      }
    }
    return result;
  }

  /**
   * @param {*} dest
   * @param {Error | String} message
   * @param {String} type
   * @param {Function} consoleMethod
     */
  function writeToDest(dest, message, type, consoleMethod) {
    var d = moment().format('DD.MM HH:mm');
    var m = message instanceof Error ? message.message : message;
    for (var i = 0; i < dest.length; i++) {
      if (dest[i] === 'console') {
        if (consoleMethod === console.error && message instanceof Error) {
          console.error(message);
        } else {
          consoleMethod.call(console, d + ' ' + type + ' ' + prefix + ' ' + m);
        }
      } else if (dest[i] instanceof Logger) {
        dest[i][type.toLowerCase()](message);
      } else if (typeof dest[i].info === 'function') {
        dest[i].info(prefix + ' ' + m);
      } else if (typeof dest[i].write === 'function') {
        if (type === 'ERROR') {
          dest[i].write(d + ' ' + type + ' ' + prefix + ' ' + m + '\r\n' + (message.stack || ''));
        } else {
          dest[i].write(d + ' ' + type + ' ' + prefix + ' ' + m + '\r\n');
        }
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
   * @param {String | Error | IonError} message
   */
  this._error = function (message) {
    if (message instanceof IonError && message.cause) {
      this._error(message.cause);
    }
    writeToDest(errDestinations, message, 'ERROR', console.error);
  };
}

IonLogger.prototype = new Logger();

module.exports = IonLogger;
