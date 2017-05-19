/**
 * Created by krasilneg on 25.04.17.
 */
'use strict';
const codes = require('core/errors/data-source');

module.exports = {
  [codes.UNIQUENESS_VIOLATION]: `Нарушена уникальность ключа '%key' набора данных '%table'`,
  [codes.BAD_QUERY]: `Ошибка в запросе.`,
  [codes.OPER_FAILED]: `Операция '%oper' на применена к набору данных '%table'.`
};
