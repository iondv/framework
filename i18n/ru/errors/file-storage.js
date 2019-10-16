/**
 * Created by krasilneg on 25.04.17.
 */
'use strict';
const codes = require('core/errors/file-storage');

module.exports = {
  [codes.BAD_DATA]: `Uncorrected data format.`,
  [codes.NO_DIR]: `Directory '%dir' not found.`,
  [codes.NO_FILE]: `File '%file' not found.`
};
