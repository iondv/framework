/**
 * Created by krasilneg on 25.04.17.
 */
'use-strict';

const IonError = require('core/IonError');
const path = require('path');
const fs = require('fs');

/**
 * @param {String} lang
 * @param {String} baseDir
 */
module.exports = function (lang, baseDir) {
  baseDir = baseDir || path.normalize(path.join(__dirname, '..', 'i18n'));
  var msgDir = path.join(baseDir, lang, 'errors');
  if (fs.existsSync(msgDir)) {
    IonError.registerMessages(require(msgDir));
  } else {
    throw new Error(`Error message base for language "${lang}" does not exist in path "${baseDir}"`);
  }
}