'use strict';

function PassportEsia(options) {

  let init =  {
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
  };

  let claim = {};

  let mapping = {};

  this.name = 'esia';

  this.module = 'passport-local';

  this.options = {init, claim, mapping};

}

module.exports = PassportEsia;
