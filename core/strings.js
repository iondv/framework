/**
 * Created by krasilneg on 25.04.17.
 */
const merge = require('merge');
const {setupLang} = require('./i18n-setup');

const systemBase = {};
const byLangBase = {};

const parseLang = lang => typeof lang === 'string' ? (lang.match(/[a-z]+/gi)[0]).toLowerCase() : undefined;

/**
 * @param {String} prefix
 * @param {String} id
 * @param {{}} params
 */
const strings = (prefix, id, params, language) => {
  let str;
  const lang = parseLang(language);
  if (prefix && id) {
    if (lang) {
      if (!byLangBase.hasOwnProperty(lang)) {
        setupLang(lang);
        byLangBase[lang] = byLangBase[lang] || {};
      }
      const base = byLangBase[lang];
      if (base.hasOwnProperty(prefix)) {
        if (base[prefix].hasOwnProperty(id))
          str = base[prefix][id];
      }
    }
    if (!str && systemBase.hasOwnProperty(prefix)) {
      if (systemBase[prefix].hasOwnProperty(id))
        str = systemBase[prefix][id];
    }
    if (str) {
      params && Object.keys(params).forEach((p) => {
        str = str.replace(`%${p}`, params[p]);
      });
      return str;
    }
    return id;
  }
  return '';
};
module.exports.s = strings;

/**
 * @param {String} prefix
 * @param {{}} base
 * @param {String} [lang]
 */
module.exports.registerBase = function(prefix, base, lang) {
  if (prefix && base) {
    systemBase[prefix] = merge(base, systemBase[prefix] || {});
    if (lang) {
      byLangBase[lang] = byLangBase[lang] || {};
      byLangBase[lang][prefix] = merge(base, byLangBase[lang][prefix] || {});
    }
  }
};

/**
 * @param {String} lang
 * @param {String} prefix
 * @param {{}} base
 */
module.exports.registerLang = function(language, prefix, base) {
  const lang = parseLang(language);
  if (prefix && base && Object.keys(base).length && lang) {
    byLangBase[lang] = byLangBase[lang] || {};
    byLangBase[lang][prefix] = merge(base, byLangBase[lang][prefix] || {});
  }
};

/**
 * @returns {Array.<String>}
 */
module.exports.getLangs = () => Object.keys(byLangBase);

/**
 * @param {String} prefix
 * @param {String} lang
 * @returns {Function}
 */
module.exports.unprefix = (prefix, lang) => (str, params) => strings(prefix, str, params, lang);

/**
 * @param {String} lang
 * @param {String} prefix
 * @returns {{}}
 */
module.exports.getBase = (prefix, language) => {
  const lang = parseLang(language);
  if (lang) {
    if (!byLangBase.hasOwnProperty(lang)) {
      setupLang(lang);
      byLangBase[lang] = byLangBase[lang] || {};
    }
    if (prefix && byLangBase[lang].hasOwnProperty(prefix)) {
      return byLangBase[lang][prefix] || {};
    }
    return byLangBase[lang] || {};
  } else if (systemBase.hasOwnProperty(prefix)) {
    return systemBase[prefix] || {};
  }
  return systemBase || {};
};
