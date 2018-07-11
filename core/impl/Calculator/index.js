/**
 * Created by kras on 03.11.16.
 */
'use strict';

const ICalculator = require('core/interfaces/Calculator');
const stdLib = require('./func');
const clone = require('clone');
const aggreg = require('./func/aggreg');
const data = require('./func/data');
const sequence = require('./func/sequence');
const SequenceProvider = require('core/interfaces/SequenceProvider');
const parser = require('./func/parser');

/**
 * @param {{}} options
 * @param {DataRepository | String} options.dataRepo
 * @param {SequenceProvider} options.sequenceProvider
 * @param {Logger} [options.log]
 * @constructor
 */
function Calculator(options) {

  let funcLib = clone(stdLib);

  if (options.dataRepo) {
    funcLib.sum = aggreg.sum(options.dataRepo);
    funcLib.count = aggreg.count(options.dataRepo);
    funcLib.avg = aggreg.avg(options.dataRepo);
    funcLib.max = aggreg.max(options.dataRepo);
    funcLib.min = aggreg.min(options.dataRepo);
    funcLib.merge = aggreg.merge(options.dataRepo);
    funcLib.get = data.get(options.dataRepo);
  }
  if (options.sequenceProvider instanceof SequenceProvider) {
    funcLib.next = sequence.next(options.sequenceProvider);
  }

  /**
   * @param {String | {}} formula
   */
  this._parseFormula = function (formula) {
    return parser(formula, funcLib, () => options.dataRepo);
  };
}

Calculator.prototype = new ICalculator();

module.exports = Calculator;
