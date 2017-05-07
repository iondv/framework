/**
 * Created by krasilneg on 25.04.17.
 */
'use strict';
const codes = require('core/errors/workflow');

module.exports = {
  [codes.TRANS_ERROR]: `Ошибка при выполнении перехода рабочего процесса '%trans'.`,
  [codes.STATE_NOT_FOUND]: `Не найдено состояние '%state' рабочего процесса '%workflow'.`,
  [codes.CONDITION_VIOLATION]:
    `Объект '%info' не соответствует условиям конечного состояния '%state' рабочего процесса '%workflow'.`,
  [codes.NOT_IN_WORKFLOW]: `Объект '%info' не находится в рабочем процессе '%workflow'.`,
  [codes.TRANS_IMPOSSIBLE]: `Невозможно выполнение перехода '%trans' рабочего процесса '%workflow'.`
};
