'use strict';

const passport = require('passport');

function PassportEsia(options) {

  let init =  {
    usernameField: 'username1',
    passwordField: 'password1',
    passReqToCallback: true
  };

  let claim = {};

  let mapping = {};

  this.name = 'esia';

  this.module = 'passport-local';

  this.options = {init, claim, mapping};

}

module.exports = PassportEsia;
