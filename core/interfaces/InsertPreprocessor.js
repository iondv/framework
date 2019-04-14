/**
 * Created by kras on 05.05.16.
 */
'use strict';

function InsertPreprocessor() {
  /**
   * @param {String} classname
   * @param {{}} data
   * @returns {Promise}
   */
  this.preProcess = function (classname, data, namespace) {
    return this._preProcess(classname, data, namespace);
  };
}

module.exports = InsertPreprocessor;
