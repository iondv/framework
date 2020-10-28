/**
 * Created by krasilneg on 25.04.17.
 */
'use strict';
const codes = require('core/errors/data-source');
const {t} = require('core/i18n');

module.exports = {
  [codes.UNIQUENESS_VIOLATION]: t(`Uniqueness of key '%key' of dataset '%table' is violated`),
  [codes.BAD_QUERY]: t(`Error in query.`),
  [codes.OPER_FAILED]: t(`Operation '%oper' was not applied to '%table' dataset.`)
};
