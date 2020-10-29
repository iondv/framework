/**
 * Created by krasilneg on 29.09.20.
 */
const {po, mo} = require('gettext-parser');
const Gettext = require('node-gettext');
const fs = require('fs');
const path = require('path');

const translators = {};
let defaultLocale = 'en';
const DEFAULT_DOMAIN = 'ION_TEXT_DOMAIN';

const _ = f => {
  return new Promise((resolve, reject) => f(resolve, reject));
}

const loadLang = (lang, dir, domain) => {
  return _((resolve, reject) => {
    fs.readdir(dir, (err, nms) => {
      if (err) return reject(err);
      let  p = Promise.resolve();
      nms.forEach(nm => {
        const d = path.join(dir, nm);
        p = p.then(() => _((r, j) => {
          fs.lstat(d, (err, stat) => err ? j(err) : r(stat.isDirectory()));  
        })).then(isDir => isDir ? loadLang(lang, d, domain) : _((r, j) => {
          fs.readFile(d, (err, data) => {
            if (err) return j(err);
            const type = path.extname(nm);
            if (!translators.hasOwnProperty(lang)) {
              translators[lang] = new Gettext();
              translators[lang].setLocale(lang);
              translators[lang].setTextDomain(DEFAULT_DOMAIN);
            }
            translators[lang].addTranslations(
              lang,
              domain || DEFAULT_DOMAIN,
              ((type == 'po') ? po : mo).parse(data)
            );
            r();
          });
        }));
      });
      p.then(resolve).catch(reject);
    });
  });
}

module.exports.load = (dir, domain, lang) => {
  return _((resolve, reject) => {
    if (!dir) return resolve();
    if (lang) {
      const d = path.join(dir, lang);
      return _((r, j) => {fs.lstat(d, (err, stat) => err ? j(err) : r(stat.isDirectory()));})
        .then(load => load ? loadLang(lang, d, domain) : null);
    }
    fs.readdir(dir, (err, nms) => {
      if (err) return reject(err);
      let  p = Promise.resolve();
      nms.forEach(lang => {
        const d = path.join(dir, lang);
        p = p.then(() => _((r, j) => {
          fs.lstat(d, (err, stat) => err ? j(err) : r(stat.isDirectory()));  
        })).then(load => load ? loadLang(lang, d, domain) : null);
      });
      p.then(resolve).catch(reject);
    });
  });
};

module.exports.lang = lang => {
  defaultLocale = lang || defaultLocale;
};

module.exports.domain = domain => {
  for (lang in translators) {
    translators[lang].setTextDomain(domain);
  }
}

module.exports.supported = () => {
  return Object.keys(translators);
}

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
}

module.exports.w = (msg, ...args) => ({lang, domain}) => t(msg, ...args, {lang, domain});