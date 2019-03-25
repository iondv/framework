/**
 * Created by kras on 08.10.16.
 */
'use strict';

module.exports = function (data, enc) {
  if (parseInt(process.version.substr(1, 1)) < 6) {
    return new Buffer(data, enc);
  }
  return Buffer.from(data, enc);
};
