/**
 * Created by krasilneg on 25.04.17.
 */
const merge = require('merge');
const systemBase = {};

const defaultBase = () => ({
  get: id => id,
  toJSON: () => ({})
});
defaultBase.has = () => false;

//const parseLang = lang => typeof lang === 'string' ? (lang.match(/[a-z]+/gi)[0]).toLowerCase() : undefined;

/**
 * @param {String} prefix
 * @param {String} id
 * @param {{}} params
 * @param {String} lang
 */
const strings = (prefix, id, params, lang) => {
  if (prefix && id) {
    let str = id;
    if (systemBase.hasOwnProperty(prefix)) {
      const base = systemBase[prefix];
      if (base.has(id))
        str = base(lang, prefix).get(id);
    }
    params && Object.keys(params).forEach(p => {
      str = str.replace(`%${p}`, params[p]);
    });
    return str;
  }
  return '';
};

module.exports.s = strings;

function wrap(msgs, prev) {
  const result = (lang, domain) => {
    const base = prev(lang);
    return {
      get: id => {
        if (msgs.hasOwnProperty(id)) {
          return msgs[id]({lang, domain});
        }
        return base.get(id);
      },
      toJSON: () => {
        let result = {};
        for (id in msgs) {
          result[id] = msgs[id]({lang, domain});
        }
        return merge(base.toJSON(), result);
      }
    }
  };
  result.has = (id) => {
    return msgs.hasOwnProperty(id) || prev.has(id);
  }
  return result;
}

/**
 * @param {String} prefix
 * @param {Function} base
 */
const register = module.exports.registerBase = function(prefix, base) {
  if (prefix && ('function' == typeof base)) {
    systemBase[prefix] = base(systemBase[prefix] || defaultBase);
  } else if (prefix && ('object' == typeof base)) {
    systemBase[prefix] = wrap(base, systemBase[prefix] || defaultBase);
  } else if (prefix && ('string' == typeof base)) {
    register(prefix, require(base));
  }
};

/**
 * @param {String} prefix
 * @param {String} lang
 * @returns {Function}
 */
module.exports.unprefix = (prefix) => (str, params, lang) => strings(prefix, str, params, lang);

/**
 * @param {String} lang
 * @param {String} prefix
 * @returns {{}}
 */
module.exports.getBase = (prefix) => {
  if (!prefix) {
    return lang => ({
      has: id => {
        const bases = Object.values(systemBase);
        for (base of bases) {
          if (base.has(id))
            return true;
        }
        return false;
      },
      get: id => {
        const bases = Object.values(systemBase);
        for (base of bases) {
          if (base.has(id)) {
            return base(lang, prefix).get(id);
          }
        }
        return id;
      },
      toJSON: () => {
        let result = {};
        const bases = Object.values(systemBase);
        for (base of bases) {
            result = merge(result, base(lang, prefix).toJSON());
        }
        return result;
      }  
    })
  }
  return systemBase[prefix] || defaultBase;
};
