const {
  merge, isConfig, processDir, readConfig
} = require('core/util/read');
const {toAbsolute} = require('core/system');
const strings = require('core/strings');
const fs = require('fs');
const path = require('path');

/**
 * @param {String} lang
 * @param {String} dir
 * @param {String} prefix
 */
module.exports = function i18nSetup(lang, dir, prefix = 'i18n') {
  const msgDir = path.join(toAbsolute(dir), lang);
  if (!fs.existsSync(msgDir)) // eslint-disable-line no-sync
    throw new Error(`Error message base for language "${lang}" does not exist in path "${msgDir}"`);
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
  strings.registerBase(prefix, base);
};
