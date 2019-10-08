const {
  merge, isConfig, processDir, processDirAsync, readConfig, readConfigAsync
} = require('core/util/read');
const {toAbsolute} = require('core/system');
const strings = require('core/strings');
const path = require('path');

/**
 * @param {String} lang
 * @param {String} dir
 * @param {String} prefix
 * @returns {Promise}
 */
function i18nSetup(lang, dir, prefix = 'i18n') {
  const msgDir = path.join(toAbsolute(dir), lang);
  let base;
  try {
    base = require(msgDir);
  } catch (err) {
    // Do nothing
  }
  base = base || {};
  return processDirAsync(msgDir, isConfig)
    .catch(() => [])
    .then(files => Promise.all(files.map(fn => readConfigAsync(fn))))
    .then((messages) => {
      messages.forEach((msg) => {
        base = merge(base, msg);
      });
      strings.registerBase(prefix, base);
    });
}

/**
 * @param {String} lang
 * @param {String} dir
 * @param {String} prefix
 */
function i18nSetupSync(lang, dir, prefix = 'i18n') {
  const msgDir = path.join(toAbsolute(dir), lang);
  let base;
  try {
    base = require(msgDir);
  } catch (err) {
    // Do nothing
  }
  base = base || {};
  processDir(
    msgDir,
    isConfig,
    (fn) => {
      const messages = readConfig(fn);
      base = merge(base, messages);
    },
    (err) => {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    },
    false
  );
  strings.registerBase(prefix, base);
}

module.exports.i18nSetup = i18nSetup;
module.exports.i18nSetupSync = i18nSetupSync; // eslint-disable-line no-sync
