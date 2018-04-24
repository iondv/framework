'use strict';

function PassportEsia(options) {

  let init = options.init || {};
  let claim = {};
  let mapping = {
    id: 'oid',
    name: 'fullname',
    birthdate: 'birthdate',
    gender: 'gender',
    snils: 'snils',
    inn: 'inn',
    email: 'email',
    mobile: 'mobile'
  };
  this.name = 'esia';

  this.module = 'lib/esiaStrategy';

  this.options = {
    init,
    claim,
    mapping,
    success: options.success || null
  };

}

module.exports = PassportEsia;
