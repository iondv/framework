/**
 * Created by kras on 03.11.16.
 */
'use strict';

function Calculator() {
  /**
   * @param {String} formula
   */
  this.parseFormula = function (formula) {
    return this._parseFormula(formula);
  };
}

module.exports = Calculator;
