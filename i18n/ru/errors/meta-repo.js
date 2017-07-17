/**
 * Created by krasilneg on 25.04.17.
 */
'use strict';
const codes = require('core/errors/meta-repo');

module.exports = {
  [codes.NO_CLASS]: `Класс '%class' не найден.`,
  [codes.NO_ATTR]: `Атрибут '%attr' не найден в классе '%class'.`,
  [codes.NO_VIEW]: `Представление '%view' не найдено.`,
  [codes.NO_WORKFLOW]: `Рабочий процесс '%workflow' не найден.`
};
