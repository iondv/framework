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

// DataSource Error Codes
IonError.ERR_DS_REQUEST = 'ds_request';
IonError.ERR_DS_CONNECT = 'ds_connect';
IonError.ERR_DS_UNIQ_KEY = 'ds_uniq_key';

// DataRepository Error Codes
IonError.ERR_DR_REQUEST = 'dr_request';
IonError.ERR_DR_COL_P = 'dr_collection_params';
IonError.ERR_DR_COL_REQ = 'dr_collection_request';
IonError.ERR_DR_ITEM_EXISTS = 'dr_item_exists';

// WorkflowProvider Error Codes
IonError.ERR_WF_P = 'wf_params';

module.exports = IonError;
