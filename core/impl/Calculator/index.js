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
const DataRepository = require('core/interfaces/DataRepository').DataRepository;
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

  let drg = null;

  this.init = function (scope) {
    drg = function () {return typeof options.dataRepo === 'string' ? scope[options.dataRepo] : options.dataRepo};
    let dataRepo = drg();
    if (dataRepo instanceof DataRepository) {
        funcLib.sum = aggreg.sum(dataRepo);
        funcLib.count = aggreg.count(dataRepo);
        funcLib.avg = aggreg.avg(dataRepo);
        funcLib.max = aggreg.max(dataRepo);
        funcLib.min = aggreg.min(dataRepo);
        funcLib.merge = aggreg.merge(dataRepo);
        funcLib.get = data.get(dataRepo);
    }
    if (options.sequenceProvider instanceof SequenceProvider) {
      funcLib.next = sequence.next(options.sequenceProvider);
    }
    return Promise.resolve();
  };

  function warn(msg) {
    (options.log || console).warn(msg);
  }

  /**
   * @param {String | {}} formula
   */
  this._parseFormula = function (formula) {
    return parser(formula, funcLib, warn, drg);
  };
}

Calculator.prototype = new ICalculator();

module.exports = Calculator;
