const PREFIX = 'auth';

module.exports = {
  NO_DS: `${PREFIX}.nods`,
  FORBID: `${PREFIX}.forbid`,
  TMP_BLOCK: `${PREFIX}.tmpb`,
  FAIL: `${PREFIX}.fail`,
  LACK_PWD: `${PREFIX}.lackpwd`,
  UNAVAILABLE: `${PREFIX}.unavail`,
  NO_PWD: `${PREFIX}.nopwd`,
  INTERNAL_ERR: `${PREFIX}.500`,
  BAD_PWD_REPEAT: `${PREFIX}.bpwdr`,
  MIN_PWD_LENGTH: `${PREFIX}.mpwdl`,
  PRIOR_PWD: `${PREFIX}.priorpwd`,
  WEAK_PWD: `${PREFIX}.weakpwd`,
  UPPER_LOWER: `${PREFIX}.uplower`,
  NUMBERS: `${PREFIX}.numbers`,
  SPECIAL: `${PREFIX}.special`,
  AND: `${PREFIX}.and`,
  REG_BAN: `${PREFIX}.regban`,
  REG_FAIL: `${PREFIX}.regfail`,
  EDIT_USER_FAIL: `${PREFIX}.euf`,
  PWD_BAN_NOT_FINISHED: `${PREFIX}.pbnf`,
  NOT_AUTHENTICATED: `${PREFIX}.notauthent`,
  USER_BAN: `${PREFIX}.usrban`,
  BAD_USER_ID: `${PREFIX}.badid`,
  EXT_AUTH_FAIL: `${PREFIX}.extauthfail`,
  NO_STRATEGY: `${PREFIX}.nostrategy`
};
