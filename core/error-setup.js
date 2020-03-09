/**
 * Created by krasilneg on 25.04.17.
 */

const IonError = require('core/IonError');
const {
  merge, isConfig, processDir, readConfig
} = require('core/util/read');
const path = require('path');
const fs = require('fs');

/**
 * @param {String} lang
 * @param {String} baseDir
 */
module.exports = function errorSetup(lang, baseDir) {
  baseDir = baseDir || path.normalize(path.join(__dirname, '..', 'i18n'));
  const msgDir = path.join(baseDir, lang, 'errors');
  if (!fs.existsSync(msgDir)) // eslint-disable-line no-sync
    throw new Error(`Error message base for language "${lang}" does not exist in path "${baseDir}"`);
  let base;
  try {
    base = require(msgDir);
  } catch (err) {
    // Do nothing
  }
  base = base || {};
  processDir(msgDir, isConfig, (fn) => {
    const messages = readConfig(fn);
    base = merge(base, messages);
  });
  IonError.registerMessages(base, lang);
};
