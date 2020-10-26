/**
 * Created by kalias_90 on 23.05.17.
 */
'use strict';

const codes = require('core/errors/validation');
const {t} = require('core/i18n');

const defaultMessage = t('Некорректное значение передано в атрибут %class.%property.');
const messageForRealAndDecimal = t('Значение атрибута %class.%property должно быть числом (дробная часть отделяется точкой).');
const messageForDatetimeAndPeriod = t('Некорректное значение даты передано в атрибут %class.%property.');

module.exports = {
  [codes.INCORRECT_VALUE.INT]: t('Значение атрибута %class.%property должно быть целым числом.'),
  [codes.INCORRECT_VALUE.REAL]: messageForRealAndDecimal,
  [codes.INCORRECT_VALUE.DECIMAL]: messageForRealAndDecimal,
  [codes.INCORRECT_VALUE.DATETIME]: messageForDatetimeAndPeriod,
  [codes.INCORRECT_VALUE.PERIOD]: messageForDatetimeAndPeriod,
  [codes.INCORRECT_VALUE.DEFAULT]: defaultMessage
};
