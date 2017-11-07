/**
 * Created by kras on 03.11.16.
 */
'use strict';

const ICalculator = require('core/interfaces/Calculator');
const stdLib = require('./func');
const clone = require('clone');
const aggreg = require('./func/aggreg');
const data = require('./func/data');
const DataRepository = require('core/interfaces/DataRepository').DataRepository;
const parser = require('./func/parser');

/**
 * @param {{}} options
 * @param {DataRepository | String} options.dataRepo
 * @param {Logger} [options.log]
 * @constructor
 */
function Calculator(options) {

  let funcLib = clone(stdLib);

  this.init = function (scope) {
    return new Promise(function (resolve) {
      let dataRepo = typeof options.dataRepo === 'string' ? scope[options.dataRepo] : options.dataRepo;
      if (dataRepo instanceof DataRepository) {
        funcLib.sum = aggreg.sum(dataRepo);
        funcLib.count = aggreg.count(dataRepo);
        funcLib.avg = aggreg.avg(dataRepo);
        funcLib.max = aggreg.max(dataRepo);
        funcLib.min = aggreg.min(dataRepo);
        funcLib.merge = aggreg.merge(dataRepo);
        funcLib.get = data.get(dataRepo);
      }
      resolve();
    });
  };

  function warn(msg) {
    (options.log || console).warn(msg);
  }

  /**
   * @param {String | {}} formula
   */
  this._parseFormula = function (formula) {
    return parser(formula, funcLib, warn);
  };
}

Calculator.prototype = new ICalculator();

module.exports = Calculator;
