/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 4/4/17.
 */
'use strict';

/**
 *
 * @param {{}} options
 * @constructor
 */
function RegistrationFormPlugin(options = {}) {

  let fields = options.fields || {};

  function prep(fields) {
    return Promise.resolve({});
  }

  this.inject = function () {
    return new Promise(function (resolve, reject) {
      if (options.auth && options.auth.injectPlugins) {
        options.auth.injectPlugins(fields, prep);
      }
      return resolve();
    });
  };

};

module.exports = RegistrationFormPlugin;
