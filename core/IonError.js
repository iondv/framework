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

IonError.ERR_DS_REQUEST = 'ds_request';
IonError.ERR_DS_CONNECT = 'ds_connect';
IonError.ERR_DS_UNIQ_KEY = 'ds_uniq_key';

IonError.ERR_DR_REQUEST = 'dr_request';
module.exports = IonError;
