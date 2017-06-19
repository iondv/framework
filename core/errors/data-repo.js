/**
 * Created by krasilneg on 25.04.17.
 */
'use strict';
const PREFIX = 'data-repo';

module.exports = {
  ITEM_EXISTS: `${PREFIX}.exists`,
  ITEM_EXISTS_MULTI: `${PREFIX}.iem`,
  ITEM_NOT_FOUND: `${PREFIX}.inf`,
  EXISTS_IN_COL: `${PREFIX}.eic`,
  BAD_PARAMS: `${PREFIX}.bp`,
  FILE_ATTR_SAVE: `${PREFIX}.fas`,
  FILE_ATTR_LOAD: `${PREFIX}.fal`,
  NO_COLLECTION: `${PREFIX}.nocol`,
  INVALID_META: `${PREFIX}.im`,
  COMPOSITE_KEY: `${PREFIX}.ck`,
  CONTAINER_NOT_FOUND: `${PREFIX}.cnf`,
  FAIL: `${PREFIX}.fail`,
  MISSING_REQUIRED: `${PREFIX}.mr`,
  NO_KEY_SPEC: `${PREFIX}.nkv`,
  NO_BACK_REF: `${PREFIX}.nbr`,
  UNEXPECTED_ASYNC: `${PREFIX}.ueasync`,
  PERMISSION_LACK: `${PREFIX}.noperm`
};
