/**
 * Created by krasilneg on 07.12.16.
 */
'use strict';

module.exports = function (obj) {
  if (obj) {
    for (var nm in obj) {
      if (obj.hasOwnProperty(nm)) {
        return false;
      }
    }
  }
  return true;
};
