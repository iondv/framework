/**
 * Created by krasilneg on 25.04.17.
 */
const codes = require('core/errors/data-repo');

module.exports = {
  [codes.ITEM_EXISTS]: `%class c таким атрибутом '%attr' уже существует.`,
  [codes.ITEM_EXISTS_MULTI]: `%class c такими атрибутами '%attr' уже существует.`,
  [codes.ITEM_NOT_FOUND]: `Объект '%info' не найден.`,
  [codes.EXISTS_IN_COL]: `Объект '%info' уже присутствует в коллекции '%col'.`,
  [codes.BAD_PARAMS]: `Некорректные параметры переданы методу '%method'.`,
  [codes.FILE_ATTR_SAVE]: `Не удалось сохранить данные в файловый атрибут '%attr' объекта '%info'.`,
  [codes.FILE_ATTR_LOAD]: `Не удалось загрузить файловый атрибут '%attr'.`,
  [codes.NO_COLLECTION]: `В объекте %info отсутствует коллекция '%attr'.`,
  [codes.INVALID_META]: `Ошибка в мета-данных класса объекта '%info'.`,
  [codes.COMPOSITE_KEY]: `Использование составных ключей в операции '%oper' не поддерживается.`,
  [codes.FAIL]: `Действие '%operation' не было выполнено для объекта '%info'.`,
  [codes.MISSING_REQUIRED]: `Не заполнены обязательные атрибуты %info.`,
  [codes.NO_KEY_SPEC]: `Не указано значение ключевого атрибута %info.`,
  [codes.NO_BACK_REF]: `По обратной ссылке %backRef не найден атрибут %backAttr.`
};
