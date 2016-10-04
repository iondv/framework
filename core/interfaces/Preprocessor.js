/**
 * Created by kras on 12.09.16.
 */
'use strict';

function Preprocessor() {
  /**
   * @param {{}} data
   * @param {{}} [options]
   * @returns {Promise}
   */
  this.process = function (data, options) {
    return this._process(data, options);
  };
}

module.exports = Preprocessor;
