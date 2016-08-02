/**
 * Created by Данил on 02.08.2016.
 */

'use strict';

/**
 * @constructor
 */
function ISignedDataHandler() {
  /**
   * @param {String} itemId
   * @param {String} action
   * @param {Object} attributes
   * @param {(String|DataPart[])} data
   * @param {(String|String[])} signatures
   */
  this.process = function (itemId, action, attributes, data, signatures) {
    return this._process(itemId, action, attributes, data, signatures);
  };
};

module.export = ISignedDataHandler;
