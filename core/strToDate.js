/**
 * Created by krasilneg on 22.02.17.
 */
const moment = require('moment');

module.exports = function (str, lang) {
  var dt;
  try {
    dt = moment(str, 'L LT', lang);
    if (!dt.isValid()) {
      dt = moment(str, 'L', lang);
    }
    if (!dt.isValid()) {
      dt = moment(str, moment.ISO_8601);
    }

    if (dt.isValid()) {
      return dt.toDate();
    }
  } catch (err) {
    // Do nothing
  }
  return null;
};
