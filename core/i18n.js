/**
 * Created by krasilneg on 29.09.20.
 */
const {po, mo} = require('gettext-parser');
const Gettext = require('node-gettext');
const fs = require('fs');
const path = require('path');
const {promisify: __} = require('util');
const readdir = __(fs.readdir);
const lstat = __(fs.lstat);
const readFile = __(fs.readFile);
const merge = require('merge');

const translators = {};
const translations = {};
let defaultLocale = process.env.LANG || 'en_US';
const DEFAULT_DOMAIN = 'ION_TEXT_DOMAIN';

const loadLang = async (lang, dir, domain) => {
  const nms = await readdir(dir);
  for (nm of nms) {
    const d = path.join(dir, nm);
    const stat = await lstat(d);
    if (stat.isDirectory()) {
      return await loadLang(lang, d, domain);
    } else {
      const data = await readFile(d);
      const type = path.extname(nm).substring(1);
      if (!translations.hasOwnProperty(lang)) {
        translations[lang] = {};
      }
      merge.recursive(
        translations[lang],
        {
          [domain || DEFAULT_DOMAIN]: ((type == 'po') ? po : mo).parse(data, 'utf-8')
        }
      );
    }
  }
};

const applyLang = (lang) => {
  if (!translators.hasOwnProperty(lang)) {
    translators[lang] = new Gettext();
    translators[lang].setLocale(lang);
    translators[lang].setTextDomain(DEFAULT_DOMAIN);
  }
  for (let domain in translations[lang]) {
    translators[lang].addTranslations(lang, domain, translations[lang][domain]);
  }
};

module.exports.load = async (dir, domain, lang) => {
    if (!dir) return;
    if (lang) {
      try {
        const d = path.join(dir, lang);
        const stat = await lstat(d);
        if (stat.isDirectory()) {
          await loadLang(lang, d, domain);
          applyLang(lang);
        }
      } catch (err) {
        console.error(err);
      }
    }
    let nms;
    try {
      nms = await readdir(dir);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error(err);
      }
      return;
    }
    try {
      for (lang of nms) {
        const d = path.join(dir, lang);
        const stat = await lstat(d);
        if (stat.isDirectory()) {
          await loadLang(lang, d, domain);
          applyLang(lang);
        }     
      }
    } catch (err) {
      console.error(err);
      return;
    }
};

module.exports.lang = lang => {
  defaultLocale = lang || defaultLocale;
};

module.exports.domain = domain => {
  for (lang in translators) {
    translators[lang].setTextDomain(domain);
  }
};

module.exports.supported = () => {
  return Object.keys(translators);
};

const t = module.exports.t = (msg, ...args) => {
  let plural;
  let plural_msg;
  let lang;
  let domain;

  args.forEach(arg => {
    if (typeof arg == 'object') {
      lang = arg.lang;
      domain = arg.domain;
    } else if (typeof arg == 'string') {
      plural_msg = arg;
    } else if (typeof arg == 'number') {
      plural = arg;
    }
  });

  lang = lang || defaultLocale;
  if (!translators.hasOwnProperty(lang)) {
    return (typeof plural == 'undefined') ? msg : (plural_msg || msg);
  }
  if (typeof domain != 'undefined') {
    return (typeof plural == 'undefined') ?
      translators[lang].dgettext(domain, msg) :
      translators[lang].dngettext(domain, msg, plural_msg || msg, plural);
  }
  return (typeof plural == 'undefined') ?
    translators[lang].gettext(msg) :
    translators[lang].ngettext(msg, plural_msg || msg, plural);
};

module.exports.w = (msg, ...args) => ({lang, domain}) => t(msg, ...args, {lang, domain});

Error.prototype.getMessage = function (lang) {
  return t(this.message, {lang});
};
