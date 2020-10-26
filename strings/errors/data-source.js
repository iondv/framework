/**
 * Created by krasilneg on 25.04.17.
 */
'use strict';
const codes = require('core/errors/data-source');
const {t} = require('core/i18n');

module.exports = {
  [codes.UNIQUENESS_VIOLATION]: t(`Нарушена уникальность ключа '%key' набора данных '%table'`),
  [codes.BAD_QUERY]: t(`Ошибка в запросе.`),
  [codes.OPER_FAILED]: t(`Операция '%oper' на применена к набору данных '%table'.`)
};
