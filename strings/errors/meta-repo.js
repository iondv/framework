/**
 * Created by krasilneg on 25.04.17.
 */
'use strict';
const codes = require('core/errors/meta-repo');
const {t} = require('core/i18n');

module.exports = {
  [codes.NO_CLASS]: t('Класс %class не найден в пространстве имен %namespace.'),
  [codes.NO_ATTR]: t('Атрибут \'%attr\' не найден в классе \'%class\'.'),
  [codes.NO_VIEW]: t('Представление \'%view\' не найдено.'),
  [codes.NO_WORKFLOW]: t('Рабочий процесс \'%workflow\' не найден.')
};
