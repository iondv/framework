/**
 * Created by kalias_90 on 23.05.17.
 */
'use strict';

const codes = require('core/errors/validation');

const defaultMessage = `An invalid value was passed to the %class.%property attribute.`;
const messageForRealAndDecimal = defaultMessage + ` The value must be a number (the fractional part is separated by a dot).`;
const messageForDatetimeAndPeriod = `An invalid date value was passed to the %class.%property attribute.`;

module.exports = {
  [codes.INCORRECT_VALUE.INT]: defaultMessage + ` Value must be an integer.`,
  [codes.INCORRECT_VALUE.REAL]: messageForRealAndDecimal,
  [codes.INCORRECT_VALUE.DECIMAL]: messageForRealAndDecimal,
  [codes.INCORRECT_VALUE.DATETIME]: messageForDatetimeAndPeriod,
  [codes.INCORRECT_VALUE.PERIOD]: messageForDatetimeAndPeriod,
  [codes.INCORRECT_VALUE.DEFAULT]: defaultMessage
};
