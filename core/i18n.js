/**
 * Created by krasilneg on 29.09.20.
 */
const {po, mo} = require('gettext-parser');
const Gettext = require('node-gettext');
const fs = require('fs');
const path = require('path');

const translators = {};

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

module.exports.register = (dir) => {
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

module.exports.t = msg => ({lang, plural, domain}) => {
  if (!translators.hasOwnProperty(lang)) {
    throw new Error(`Locale ${lang} is not initialized.`);
  }
  if (typeof domain != 'undefined') {
    return (typeof plural == 'undefined') ?
      translators[lang].dgettext(domain, msg) :
      translators[lang].dngettext(domain, msg, msg, plural);
  }
  return (typeof plural == 'undefined') ?
    translators[lang].gettext(msg) :
    translators[lang].ngettext(msg, msg, plural);
};