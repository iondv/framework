'use strict';

const passport = require('passport');

function PassportEsia(options) {

  function init(username, password, done) {
    
  }

  this.name = 'esia';

  this.module = 'passport-oauth';

  this.options = {init, mapping:{}};

}

module.exports = PassportEsia;
