/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 2/27/17.
 */
'use strict';

/**
 *
 * @param {Number} code
 * @param {String} message
 * @param {Error} error
 * @constructor
 */
function IonError(code, message, error) {

  this.code = code;
  this.name = 'IonError';
  this.message = message || error.message;
  this.stack = error.stack;

}

IonError.prototype = Object.create(Error.prototype);
IonError.prototype.constructor = IonError;
module.exports = IonError;
