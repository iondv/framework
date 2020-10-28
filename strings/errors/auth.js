const codes = require('core/errors/auth');
const {t} = require('core/i18n');

module.exports = {
  [codes.NO_DS]: t(`Authentication datasource is not set up.`),
  [codes.FORBID]: t(`You dont have enough permissions to login.`),
  [codes.TMP_BLOCK]: t(`Account is blocked till %d`),
  [codes.FAIL]: t(`Failed to sign in.`),
  [codes.LACK_PWD]: t(`Account is not secured with password.`),
  [codes.UNAVAILABLE]: t(`Sign in is temporary unavailable due to technical reasons.`),
  [codes.NO_PWD]: t(`User password not specified`),
  [codes.INTERNAL_ERR]: t(`Internal server error`),
  [codes.BAD_PWD_REPEAT]: t(`Wrong password repeat!`),
  [codes.MIN_PWD_LENGTH]: t(`Minimal password length is %p symbols`),
  [codes.PRIOR_PWD]: t(`Using one of %p previous passwords is prohibited.`),
  [codes.WEAK_PWD]: t(`Password too weak. Password should contain `),
  [codes.UPPER_LOWER]: t(`letters in lower and upper case`),
  [codes.NUMBERS]: t(`numbers`),
  [codes.SPECIAL]: t(`special symbols (@, $, & etc.)`),
  [codes.AND]: t(`and`),
  [codes.REG_BAN]: t(`Public sign up is prohibited!`),
  [codes.REG_FAIL]: t(`User sign up failed!`),
  [codes.EDIT_USER_FAIL]: t(`Failed to edit user profile!`),
  [codes.PWD_BAN_NOT_FINISHED]: t(`Password change prohibition period was not ended.`),
  [codes.NOT_AUTHENTICATED]: t(`User was not authenicated.`),
  [codes.USER_BAN]: t(`User is blocked.`),
  [codes.BAD_USER_ID]: t(`Failed to determine user id.`),
  [codes.EXT_AUTH_FAIL]: t(`Failed to sign up user from external system.`),
  [codes.NO_STRATEGY]: t(`No strategy specified for passport %nm`)
};
