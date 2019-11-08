/**
 * Created by krasilneg on 25.04.17.
 */
const merge = require('merge');
const {setupLang} = require('./i18n-setup');

const systemBase = {};
const byLangBase = {};

/**
 * @param {String} prefix
 * @param {String} id
 * @param {{}} params
 */
const strings = (prefix, id, params, lang) => {
  let str;
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
        console.log(str);
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
module.exports.registerLang = function(lang, prefix, base) {
  if (prefix && base && lang) {
    byLangBase[lang] = byLangBase[lang] || {};
    byLangBase[lang][prefix] = merge(base, byLangBase[lang][prefix] || {});
  }
};

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
module.exports.getBase = (prefix, lang) => {
  if (lang) {
    if (!byLangBase.hasOwnProperty(lang)) {
      setupLang(lang);
      byLangBase[lang] = byLangBase[lang] || {};
    }
    if (byLangBase[lang].hasOwnProperty(prefix)) {
      return byLangBase[lang][prefix] || {};
    }
  } else if (systemBase.hasOwnProperty(prefix)) {
    return systemBase[prefix] || {};
  }
  return {};
};
