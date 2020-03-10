const codes = require('core/errors/auth');

module.exports = {
  [codes.NO_DS]: `Не настроен источник данных аутентификации.`,
  [codes.FORBID]: `Недостаточно прав для входа.`,
  [codes.TMP_BLOCK]: `Учетная запись заблокирована до %d`,
  [codes.FAIL]: `Не удалось выполнить вход.`,
  [codes.LACK_PWD]: `Учетная запись не защищена паролем.`,
  [codes.UNAVAILABLE]: `По техническим причинам вход в систему временно невозможен.`,
  [codes.NO_PWD]: `Не указан пароль пользователя`,
  [codes.INTERNAL_ERR]: `Внутренняя ошибка сервера`,
  [codes.BAD_PWD_REPEAT]: `Неверно выполнен повтор пароля!`,
  [codes.MIN_PWD_LENGTH]: `Минимальная длина пароля: %p символов`,
  [codes.PRIOR_PWD]: `Недопустимо использовать один из %p предыдущих паролей.`,
  [codes.WEAK_PWD]: `Пароль не прошел проверку на сложность. Пароль должен содержать `,
  [codes.UPPER_LOWER]: `буквы в нижнем и верхнем регистре`,
  [codes.NUMBERS]: `цифры`,
  [codes.SPECIAL]: `специальные символы (@, $, & и т.д.)`,
  [codes.AND]: `и`,
  [codes.REG_BAN]: `Публичная регистрация пользователей запрещена!`,
  [codes.REG_FAIL]: `Не удалось зарегистрировать пользователя!`,
  [codes.EDIT_USER_FAIL]: `Не удалось внести изменения в профиль пользователя!`,
  [codes.PWD_BAN_NOT_FINISHED]: `Не закончился период запрета на изменение пароля.`,
  [codes.NOT_AUTHENTICATED]: `User was not authenicated.`,
  [codes.USER_BAN]: `Пользователь заблокирован.`,
  [codes.BAD_USER_ID]: `Не удалось определить идентификатор пользователя.`,
  [codes.EXT_AUTH_FAIL]: `Не удалось зарегистрировать пользователя из внешней системы.`,
  [codes.NO_STRATEGY]: `No strategy specified for passport %nm`
};
