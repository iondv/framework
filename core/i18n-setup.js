const {
  merge, isConfig, processDir, processDirAsync, readConfig, readConfigAsync
} = require('core/util/read');
const {toAbsolute} = require('core/system');
const strings = require('core/strings');
const path = require('path');

/**
 * @param {String} lang
 * @param {String} dir
 * @param {String} [prefix]
 * @param {Logger} [log]
 * @returns {Promise}
 */
function i18nSetup(lang, dir, prefix, log) {
  if (!lang || !dir) {
    return Promise.resolve();
  }
  prefix = prefix || 'i18n';
  const msgDir = path.join(toAbsolute(dir), lang);
  let base;
  try {
    base = require(msgDir);
  } catch (err) {
    // Do nothing
  }
  base = base || {};
  return processDirAsync(msgDir, isConfig)
    .catch(() => {
      log && log.info(`Base for language "${lang}" does not exist in path "${dir}"`);
      return [];
    })
    .then(files => Promise.all(files.map(fn => readConfigAsync(fn))))
    .then((messages) => {
      messages.forEach((msg) => {
        base = merge(base, msg);
      });
      strings.registerBase(prefix, base);
      log && log.info(`i18n settings for language "${lang}" registered from path "${dir}"`);
    });
}

/**
 * @param {String} lang
 * @param {String} dir
 * @param {String} [prefix]
 * @param {Logger} [log]
 */
function i18nSetupSync(lang, dir, prefix, log) {
  if (!lang || !dir) {
    return;
  }
  prefix = prefix || 'i18n';
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
      if (err.code === 'ENOENT') {
        log && log.info(`Base for language "${lang}" does not exist in path "${dir}"`);
      } else {
        throw err;
      }
    },
    false
  );
  strings.registerBase(prefix, base);
  log && log.info(`i18n settings for language "${lang}" registered from path "${dir}"`);
}

module.exports = i18nSetupSync;
module.exports.i18nSetup = i18nSetup;
module.exports.i18nSetupSync = i18nSetupSync; // eslint-disable-line no-sync
