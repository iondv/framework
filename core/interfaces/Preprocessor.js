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
   * @param {Item} item
   * @param {{}} options
   * @returns {Promise}
   */
  this.process = function (item, options) {
    return this._process(item, options);
  };
}

module.exports = Preprocessor;
