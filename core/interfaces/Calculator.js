/**
 * Created by kras on 03.11.16.
 */
'use strict';

function Calculator() {
  /**
   * @param {String | {}} formula
   * @param {{}} [options]
   */
  this.parseFormula = function (formula, options) {
    return this._parseFormula(formula, options || {});
  };
}

module.exports = Calculator;
