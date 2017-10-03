'use strict';

const Strategy = require('passport-strategy');
const util = require('util');

function EsiaStrategy(options, verify) {
  // Options = options || {};
  console.log(options, verify);
  Strategy.call(this, options, verify);
  this.name = 'esia';
}

util.inherits(EsiaStrategy, Strategy);

Strategy.prototype.authenticate = function (req, options) {
  options = options || {};
  this.success({user: 1}, {message: 'success'});
};

exports = module.exports = Strategy;
exports.Strategy = Strategy;
