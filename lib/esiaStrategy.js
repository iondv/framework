'use strict';

const LocalStrategy = require('passport-local');
const util = require('util');

function Strategy(options, verify) {
  // Options = options || {};
  LocalStrategy.call(this, options, verify);
}

util.inherits(Strategy, LocalStrategy);

module.exports = Strategy;
