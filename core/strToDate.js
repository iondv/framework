'use strict';
/**
 * Created by krasilneg on 22.02.17.
 */
const moment = require('moment');

module.exports = function (str, lang) {
  try {
    let dt;
    let offset = 0;
    if (lang) {
      dt = moment(str, 'L LT', lang);
      if (!dt.isValid()) {
        dt = moment(str, 'L', lang);
      }
    }
    if (!dt.isValid()) {
      dt = moment(str, moment.ISO_8601);
      if (dt.isValid()) {
        offset = moment.parseZone(str, moment.ISO_8601).utcOffset();
      }
    }

    if (dt.isValid()) {
      dt = dt.toDate();
      dt.utcOffset = offset;
      return dt;
    }
  } catch (err) {
    return null;
  }
};
