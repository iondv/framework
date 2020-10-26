/**
 * Created by krasilneg on 25.04.17.
 */
'use strict';
const codes = require('core/errors/workflow');
const {t} = require('core/i18n');

module.exports = {
  [codes.ACCESS_DENIED]: t(`Недостаточно прав для выполнения перехода рабочего процесса '%trans'`),
  [codes.WORKFLOW_NOT_FOUND]: t(`Рабочий процесс '%workflow' не найден.`),
  [codes.TRANS_ERROR]: t(`Ошибка при выполнении перехода рабочего процесса '%trans'.`),
  [codes.STATE_NOT_FOUND]: t(`Не найдено состояние '%state' рабочего процесса '%workflow'.`),
  [codes.CONDITION_VIOLATION]:
  t(`Объект '%info' не соответствует условиям конечного состояния '%state' рабочего процесса '%workflow'.`),
  [codes.NOT_IN_WORKFLOW]: t(`Объект '%info' не находится в рабочем процессе '%workflow'.`),
  [codes.TRANS_IMPOSSIBLE]: t(`Невозможно выполнение перехода '%trans' рабочего процесса '%workflow'.`),
  [codes.TRANS_NOT_FOUND]: t(`Не найден переход '%trans' рабочего процесса '%workflow'.`),
  [codes.IN_WORKFLOW]: t(`Объект уже находится в рабочем процессе '%workflow'`)
};
