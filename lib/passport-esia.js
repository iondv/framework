'use strict';

const passport = require('passport');

function PassportEsia(options) {

  console.log('passport yeah!');

  function init(username, password, done) {

  }

  this.name = 'esia';

  this.module = 'passport-local';

  this.options = {init, mapping: {}};

}

module.exports = PassportEsia;
