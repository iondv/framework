/**
 * Created by krasilneg on 29.09.20.
 */
const {po, mo} = require('gettext-parser');
const Gettext = require('node-gettext');
const fs = require('fs');
const path = require('path');

const translators = {};
let defaultLocale = 'en';

const _ = f => {
  return new Promise((resolve, reject) => f(resolve, reject));
}

const loadLang = (lang, dir, domain = null) => {
  return _((resolve, reject) => {
    fs.readdir(dir, (err, nms) => {
      if (err) return reject(err);
      let  p = Promise.resolve();
      nms.forEach(nm => {
        const d = path.join(dir, nm);
        p = p.then(() => _((r, j) => {
          fs.lstat(d, (err, stat) => err ? j(err) : r(stat.isDirectory()));  
        })).then(isDir => isDir ? loadLang(lang, d, nm) : _((r, j) => {
          fs.readFile(d, (err, data) => {
            if (err) return j(err);
            const type = path.extname(nm);
            if (!translators.hasOwnProperty(lang)) {
              translators[lang] = new Gettext();
              translators[lang].setLocale(lang);
            }
            translators[lang].addTranslations(
              lang,
              domain || nm.substring(0, nm.length - 3),
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

module.exports.load = (dir) => {
  return _((resolve, reject) => {
    if (!dir) return resolve();
    fs.readdir(dir, (err, nms) => {
      if (err) return reject(err);
      let  p = Promise.resolve();
      nms.forEach(lang => {
        const d = path.join(dir, lang);
        p = p.then(() => _((r, j) => {
          fs.lstat(d, (err, stat) => err ? j(err) : r(stat.isDirectory()));  
        })).then(load => load ? loadLang(lang, d) : null);
      });
      p.then(resolve).catch(reject);
    });
  });
};

module.exports.default = lang => {
  defaultLocale = lang || defaultLocale;
};

module.exports.supported = () => {
  return Object.keys(translators);
}

module.exports.t = (msg, ...args) => {
  let plural;
  let plural_msg;

  if (args.length > 0) {
    plural_msg = args[0];
    if (args.length > 1) {
      plural = args[1];
    }
  }

  return ({lang, domain}) => {
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
};