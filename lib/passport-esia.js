'use strict';

function PassportEsia(options) {

  let init = options.init || {};
  let claim = {};
  let mapping = {};

  this.name = 'esia';

  this.module = 'lib/esiaStrategy';

  this.options = {init, claim, mapping};

}

module.exports = PassportEsia;
