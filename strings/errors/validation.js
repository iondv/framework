/**
 * Created by kalias_90 on 23.05.17.
 */
'use strict';

const codes = require('core/errors/validation');
const {t} = require('core/i18n');

const defaultMessage = t('Invalid value assigned to attribute %class.%property.');
const messageForRealAndDecimal = t('Attribute %class.%property value should be a number (fractional part should be separated with dot).');
const messageForDatetimeAndPeriod = t('Invalid date value assigned to attribute %class.%property.');

module.exports = {
  [codes.INCORRECT_VALUE.INT]: t('Attribute %class.%property value should be an integer number.'),
  [codes.INCORRECT_VALUE.REAL]: messageForRealAndDecimal,
  [codes.INCORRECT_VALUE.DECIMAL]: messageForRealAndDecimal,
  [codes.INCORRECT_VALUE.DATETIME]: messageForDatetimeAndPeriod,
  [codes.INCORRECT_VALUE.PERIOD]: messageForDatetimeAndPeriod,
  [codes.INCORRECT_VALUE.DEFAULT]: defaultMessage
};
