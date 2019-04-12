/**
 * Created by kras on 08.10.16.
 */
'use strict';

module.exports = function (data, enc) {
  let v = process.version && process.version.split('.');
  if (v && (parseInt(v[0]) < 6)) {
    return new Buffer(data, enc);
  }
  return Buffer.from(data, enc);
};
