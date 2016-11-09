/**
 * Created by kras on 31.10.16.
 */
'use strict';

function ListPreprocessor() {
  /**
   * @param {String} className
   * @param {{}} options
   * @returns {Promise}
   */
  this.applicable = function (className, options) {
    return this._applicable(className, options);
  };

  /**
   * @param {Item[]} list
   * @param {{}} options
   * @returns {Promise}
   */
  this.process = function (list, options) {
    return this._process(list, options);
  };
}

module.exports = ListPreprocessor;
