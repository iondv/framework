const moment = require('moment');
const path = require('path');

/**
 * @param {String} str
 * @param {Function} cb
 */
function mapDirProperties(str, cb) {
  const regx = new RegExp('\\$\\{item\\.([^\\$\\{\\}]*)\\}', 'g');
  let result = regx.exec(str);
  while (result) {
    if (result[1]) {
      cb(result[1]);
    }
    result = regx.exec(str);
  }
}
module.exports.mapDirProperties = mapDirProperties;

/**
 * @param {String} str
 * @returns {String}
 */
function escapeSep(str) {
  return str ? (String(str)).replace(new RegExp(`\\${path.sep}`, 'g'), '') : str;
}

/**
 * @param {String} str
 * @param {String} className
 * @param {String} id
 * @param {String} attr
 * @param {Item} item
 * @returns {String|null}
 */
function parseDirName(str, className, id, attr, item) {
  if (!str)
    return null;

  const m = moment();
  let result = str.replace(/\$\{class\}/g, className || '');
  result = result.replace(/\$\{id\}/g, id || '');
  result = result.replace(/\$\{attr\}/g, attr || '');
  mapDirProperties(str, (prop) => {
    const propValue = escapeSep(item && item.get(prop) || '');
    result = result.replace(new RegExp(`\\$\\{item\\.${prop}\\}`, 'g'), propValue);
  });
  const regx = new RegExp(`\\\${([^\\${path.sep}\\$\\{\\}]*)}`, 'g');
  let moments = regx.exec(result);
  while (Array.isArray(moments)) {
    if (moments[1])
      result = result.replace(new RegExp(`\\$\\{${moments[1]}\\}`, 'g'), m.format(moments[1]));

    moments = regx.exec(result);
  }
  return path.normalize(result);
}

module.exports.parseDirName = parseDirName;

function getStorageDir(className, id, property, options, item) {
  try {
    const storageSettings = options.storageSettings || {};
    if (storageSettings[className] && storageSettings[className][property]) {
      const cn = className.split('.')[0];
      let itemGetter = Promise.resolve(item);
      if (!item && id) {
        const eagerLoading = [];
        mapDirProperties(storageSettings[className][property], (prop) => {
          if (!eagerLoading.includes(prop)) {
            eagerLoading.push(prop);
          }
        });
        const forceEnrichment = eagerLoading.map(el => el.split('.'));
        itemGetter = options.dataRepo.getItem(cn, id, {forceEnrichment});
      }
      return itemGetter
        .then(item => {
          const directory = parseDirName(storageSettings[className][property], cn, id, property, item);
          return {item, directory};
        });
    }
  } catch (err) {
    return Promise.reject(err);
  }
  return Promise.resolve({item, directory: null});
}

exports.getStorageDir = getStorageDir;
