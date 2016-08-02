/**
 * Created by Данил on 02.08.2016.
 */

'use strict';

/**
 * @constructor
 */
function IDigiSignProvider() {
  /**
   * @param {ClassMeta} c
   * @param {String} action
   * @returns {Boolean}
   */
  this.hasData = function (c, action) {
    return this._hasData(c, action);
  };
  /**
   *
   * @param {Item} item
   * @param {String} action
   * @returns {DataForSign}
   */
  this.getData = function (item, action) {
    return this._getData(item, action);
  };
}

module.export = IDigiSignProvider;
