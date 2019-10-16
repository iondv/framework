/**
 * Created by krasilneg on 25.04.17.
 */
'use strict';
const codes = require('core/errors/data-source');

module.exports = {
  [codes.UNIQUENESS_VIOLATION]: `Key uniqueness violated '%key' data set '%table'`,
  [codes.BAD_QUERY]: `Request error.`,
  [codes.OPER_FAILED]: `Operation '%oper' not applicable to data set '%table'.`
};
