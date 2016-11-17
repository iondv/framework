/**
 * Created by kras on 12.09.16.
 */
'use strict';

function Preprocessor() {
  /**
   * @param {Item} item
   * @param {{}} [options]
   * @returns {Promise}
   */
  this.applicable = function (item, options) {
    return this._applicable(item, options);
  };
  /**
   * @param {{}} values
   * @param {{}} options
   * @returns {Promise}
   */
  this.process = function (values, options) {
    return this._process(values, options);
  };
}

module.exports = Preprocessor;
