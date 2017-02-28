/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 2/27/17.
 */
'use strict';

/**
 *
 * @param {Number} code
 * @param {Error} [error]
 * @param {String} [message]
 * @constructor
 */
function IonError(code, error, message) {

  this.code = code;

  this.name = 'IonError';
  
  this.parentError = error || {};

  this.message = message || this.parentError.message;

  Error.captureStackTrace(this, IonError);

}

IonError.prototype = Object.create(Error.prototype);
IonError.prototype.constructor = IonError;
module.exports = IonError;
