/**
 * Created by krasilneg on 25.04.17.
 */

const IonError = require('core/IonError');
const path = require('path');
const fs = require('fs');
const i18n = require('core/i18n');
const lang = config.lang || 'en';
const t = msg => i18n.t(msg)({lang, domain: 'bg'});
const {format} = require('util');

/**
 * @param {String} baseDir
 */
module.exports = function errorSetup(baseDir) {
  baseDir = baseDir || path.normalize(path.join(__dirname, '..', 'strings'));
  const msgDir = path.join(baseDir, 'errors');
  if (!fs.existsSync(msgDir)) // eslint-disable-line no-sync
    throw new Error(format(t('Error message base does not exist in path "%s"'), baseDir));
  IonError.registerMessages(require(msgDir));
};
