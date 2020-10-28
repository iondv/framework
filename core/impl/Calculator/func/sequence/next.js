'use strict';
const calc = require('../util').calculate;
const i18n = require('core/i18n');
const t = msg => i18n.t(msg)({domain: 'formula'});

/**
 * @param {SequenceProvider} sp
 * @returns {Function}
 */
module.exports = function (sp) {
  return function (args) {
    return function () {
      return calc(this, args, 1, function (args) {
        if (args.length > 0) {
          return sp.next(args[0]);
        } else {
          throw new Error(t('Sequence name not specified!'));
        }
      });
    };
  };
};