/**
 * Created by krasilneg on 25.04.17.
 */
const codes = require('core/errors/data-repo');
const {t} = require('core/i18n');

module.exports = {
  [codes.ITEM_EXISTS]: t(`%class c таким атрибутом '%attr' уже существует.`),
  [codes.ITEM_EXISTS_MULTI]: t(`%class c такими атрибутами '%attr' уже существует.`),
  [codes.ITEM_NOT_FOUND]: t(`Объект '%info' не найден.`),
  [codes.EXISTS_IN_COL]: t(`Объект '%info' уже присутствует в коллекции '%col'.`),
  [codes.BAD_PARAMS]: t(`Некорректные параметры переданы методу '%method'.`),
  [codes.FILE_ATTR_SAVE]: t(`Не удалось сохранить данные в файловый атрибут '%attr' объекта '%info'.`),
  [codes.FILE_ATTR_LOAD]: t(`Не удалось загрузить файловый атрибут '%attr'.`),
  [codes.NO_COLLECTION]: t(`В объекте %info отсутствует коллекция '%attr'.`),
  [codes.INVALID_META]: t(`Ошибка в мета-данных класса объекта '%info'.`),
  [codes.COMPOSITE_KEY]: t(`Использование составных ключей в операции '%oper' не поддерживается.`),
  [codes.FAIL]: t(`Действие '%operation' не было выполнено для объекта '%info'.`),
  [codes.MISSING_REQUIRED]: t(`Не заполнены обязательные атрибуты %info.`),
  [codes.NO_KEY_SPEC]: t(`Не указано значение ключевого атрибута %info.`),
  [codes.NO_BACK_REF]: t(`По обратной ссылке %backRef не найден атрибут %backAttr.`),
  [codes.UNEXPECTED_ASYNC]: t(`При расчете значения по умолчанию атрибута %info выполнена асинхронная операция.`),
  [codes.PERMISSION_LACK]: t(`Недостаточно прав для выполнения действия`)
};
