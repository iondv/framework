const codes = require('core/errors/auth');
const {t} = require('core/i18n');

module.exports = {
  [codes.NO_DS]: t(`Не настроен источник данных аутентификации.`),
  [codes.FORBID]: t(`Недостаточно прав для входа.`),
  [codes.TMP_BLOCK]: t(`Учетная запись заблокирована до %d`),
  [codes.FAIL]: t(`Не удалось выполнить вход.`),
  [codes.LACK_PWD]: t(`Учетная запись не защищена паролем.`),
  [codes.UNAVAILABLE]: t(`По техническим причинам вход в систему временно невозможен.`),
  [codes.NO_PWD]: t(`Не указан пароль пользователя`),
  [codes.INTERNAL_ERR]: t(`Внутренняя ошибка сервера`),
  [codes.BAD_PWD_REPEAT]: t(`Неверно выполнен повтор пароля!`),
  [codes.MIN_PWD_LENGTH]: t(`Минимальная длина пароля: %p символов`),
  [codes.PRIOR_PWD]: t(`Недопустимо использовать один из %p предыдущих паролей.`),
  [codes.WEAK_PWD]: t(`Пароль не прошел проверку на сложность. Пароль должен содержать `),
  [codes.UPPER_LOWER]: t(`буквы в нижнем и верхнем регистре`),
  [codes.NUMBERS]: t(`цифры`),
  [codes.SPECIAL]: t(`специальные символы (@, $, & и т.д.)`),
  [codes.AND]: t(`и`),
  [codes.REG_BAN]: t(`Публичная регистрация пользователей запрещена!`),
  [codes.REG_FAIL]: t(`Не удалось зарегистрировать пользователя!`),
  [codes.EDIT_USER_FAIL]: t(`Не удалось внести изменения в профиль пользователя!`),
  [codes.PWD_BAN_NOT_FINISHED]: t(`Не закончился период запрета на изменение пароля.`),
  [codes.NOT_AUTHENTICATED]: t(`User was not authenicated.`),
  [codes.USER_BAN]: t(`Пользователь заблокирован.`),
  [codes.BAD_USER_ID]: t(`Не удалось определить идентификатор пользователя.`),
  [codes.EXT_AUTH_FAIL]: t(`Не удалось зарегистрировать пользователя из внешней системы.`),
  [codes.NO_STRATEGY]: t(`No strategy specified for passport %nm`)
};
