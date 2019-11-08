/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 2/27/17.
 */
const strings = require('core/strings');

/**
 *
 * @param {String | Number} code
 * @param {{}} [params]
 * @param {Error} cause
 * @constructor
 */
function IonError(code, params, cause) {

  this.code = code;

  this.cause = cause;

  this.params = params || {};

  this.message = strings.s('errors', code, params) || cause && cause.message || 'Unknown error';

  Error.captureStackTrace(this, IonError);
}

IonError.prototype = Object.create(Error.prototype);
IonError.prototype.constructor = IonError;

module.exports = IonError;

/**
 * @param {{}} base
 * @param {String} [lang]
 */
module.exports.registerMessages = function (base, lang) {
  if (base) {
    strings.registerBase('errors', base, lang);
  }
};
