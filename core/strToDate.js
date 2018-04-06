'use strict';
/**
 * Created by krasilneg on 22.02.17.
 */
const moment = require('moment');

module.exports = function (str, lang) {
  try {
    let dt;
    if (lang) {
      dt = moment(str, 'L LT', lang);
      if (!dt.isValid()) {
        dt = moment(str, 'L', lang);
      }
    }
    if (!dt.isValid()) {
      dt = moment(str, moment.ISO_8601);
    }

    if (dt.isValid()) {
      dt = dt.toDate();
      dt.utcOffset = moment.parseZone(str).utcOffset();
      return dt;
    }
  } catch (err) {
    // Do nothing
  }
  return null;
};
