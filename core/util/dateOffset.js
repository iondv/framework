const DateTypes = require('core/DateTypes');

module.exports = function (date, mode) {
  if (mode && date instanceof Date) {
    switch (mode) {
      case DateTypes.REAL:
        if (typeof date.utcOffset !== 'undefined') {
          delete date.utcOffset;
        }
        break;
      case DateTypes.LOCALIZED:
        if (typeof date.utcOffset === 'undefined') {
          date.utcOffset = date.getTimezoneOffset();
        }
        break;
      case DateTypes.UTC: {
        const offset = date.utcOffset || date.getTimezoneOffset();
        date.setUTCMinutes(date.getUTCMinutes() + offset);
        date.utcOffset = 0;
      } break;
      default:
        throw new Error('Unsupported date mode specified!');
    }
  }
  return date;
};
