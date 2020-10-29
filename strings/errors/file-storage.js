/**
 * Created by krasilneg on 25.04.17.
 */
'use strict';
const codes = require('core/errors/file-storage');
const {w: t} = require('core/i18n');

module.exports = {
  [codes.BAD_DATA]: t(`Invalid data format.`),
  [codes.NO_DIR]: t(`Directory '%dir' not found.`),
  [codes.NO_FILE]: t(`File '%file' not found.`)
};
