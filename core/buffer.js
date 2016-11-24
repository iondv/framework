/**
 * Created by kras on 08.10.16.
 */
'use strict';

module.exports = function (data, enc) {
  if (process.version.substring(1, 1) === '6') {
    return Buffer.from(data, enc);
  }
  return new Buffer(data, enc);
};
