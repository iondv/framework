const DateTypes = require('core/DateTypes');

module.exports = function (date, mode) {
  if (date instanceof Date) {
    switch (mode) {
      case DateTypes.LOCALIZED:
        if (typeof date.utcOffset === 'undefined') {
          date.utcOffset = date.getTimezoneOffset();
        }
        break;
      case DateTypes.UTC: {
        const offset = date.utcOffset || date.getTimezoneOffset();
        date.setUTCMinutes(date.getUTCMinutes() - offset);
        date.utcOffset = 0;
      } break;
      case DateTypes.REAL:
      default:
        if (typeof date.utcOffset !== 'undefined') {
          delete date.utcOffset;
        }
    }
  }
  return date;
};
