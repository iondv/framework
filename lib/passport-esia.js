'use strict';

function PassportEsia(options) {

  let init =  {
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
  };

  /*Let claim = function (err, user, info) {
    console.log(err, user, info);
  };*/

  let mapping = {};

  this.name = 'esia';

  this.module = 'lib/esiaStrategy';

  this.options = {init, claim: {}, mapping};

}

module.exports = PassportEsia;
