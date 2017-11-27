/**
 * Created by kras on 25.10.16.
 */
'use strict';
// jshint maxcomplexity: 15, bitwise: false

function addVal(result, val) {
  if (Array.isArray(result)) {
    result.push(val);
  } else {
    result[val] = true;
  }
}

const Permissions = {
  READ: 'read', // 1
  WRITE: 'write', // 2
  DELETE: 'delete', // 4
  USE: 'use', // 8
  FULL: 'full', // 31

  ATTR_CONTENT_CREATE: 'c_create',
  ATTR_CONTENT_EDIT: 'c_edit',
  ATTR_CONTENT_VIEW: 'c_view',
  ATTR_CONTENT_DELETE: 'c_delete',

  /**
   * @param {Number} mask
   * @param {Boolean} [asArray]
   */
  fromBitMask: function (mask, asArray) {
    var result = asArray ? [] : {};

    if ((1 & mask) === 1) {
      addVal(result, Permissions.READ);
    }
    if ((mask & 2) === 2) {
      addVal(result, Permissions.WRITE);
    }
    if ((mask & 4) === 4) {
      addVal(result, Permissions.DELETE);
    }
    if ((mask & 8) === 8) {
      addVal(result, Permissions.USE);
    }
    if ((mask & 31) === 31) {
      addVal(result, Permissions.FULL);
    }
    return result;
  }
};

module.exports = Permissions;
