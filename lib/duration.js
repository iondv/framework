'use strict';
/**
 * @param {String | Number} time
 * @param {Boolean} [toMs]
 * @return {{value: String, unit: String} | null}
 */
function parseDuration(time, toMs) {
  if (time && typeof time === 'string') {
    let match = time.match(/(\d+)([smhdy])/);
    if (match && match[1]) {
      if (toMs) {
        let result = parseInt(match[1]);
        switch (match[2]) {
          case 's':
            return result * 1000;
          case 'm':
            return result * 60000;
          case 'h':
            return result * 3600000;
          case 'd':
            return result * 86400000;
          case 'y':
            return result * 365 * 86400000;
          default:
            return parseInt(result);
        }
      }
      return {
        value: parseInt(match[1]),
        unit: match[2] ? match[2] : 'm'
      };
    }
  }
  if (time && typeof time === 'number') {
    return toMs ? time : {value: time, unit: 'm'};
  }
  return null;
}

module.exports = parseDuration;