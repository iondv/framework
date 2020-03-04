const path = require('path');
const moment = require('moment-timezone');

/**
 * @param {String} str
 * @param {Function} cb
 */
function mapDirProperties(str, cb) {
  const regx = new RegExp('\\$\\{item\\.([^\\$\\{\\}]*)\\}', 'g');
  let result = regx.exec(str);
  while (result) {
    if (result[1])
      cb(result[1]);
    result = regx.exec(str);
  }
}

/**
 * @param {String} str
 * @returns {String}
 */
function escapeSep(str, sep) {
  sep = sep || path.sep;
  return str
    ? (String(str)).replace(new RegExp(`\\${sep}`, 'g'), '').toString()
    : str;
}

/**
 * @param {String} str
 * @param {String} className
 * @param {String} id
 * @param {String} attr
 * @param {Item} item
 * @param {Boolean} isUrl
 * @returns {String|null}
 */
function parseDirName(str, className, id, attr, item, isUrl) {
  if (!str)
    return null;
  const sep = isUrl ? '/' : path.sep;
  const m = moment();
  let result = str.replace(/\$\{class\}/g, className || '');
  result = result.replace(/\$\{id\}/g, id || '');
  result = result.replace(/\$\{attr\}/g, attr || '');
  mapDirProperties(str, (prop) => {
    const propValue = escapeSep(item && item.get(prop) || '', sep);
    result = result.replace(new RegExp(`\\$\\{item\\.${prop}\\}`, 'g'), propValue);
  });
  const regx = new RegExp(`\\\${([^\\${sep}\\$\\{\\}]*)}`, 'g');
  const momentStr = result;
  let moments = regx.exec(momentStr);
  while (Array.isArray(moments)) {
    if (moments[1])
      result = result.replace(new RegExp(`\\$\\{${moments[1]}\\}`, 'g'), m.format(moments[1]));
    moments = regx.exec(momentStr);
  }
  return path.normalize(result);
}

function ensureItemProperties(template, cn, id, dataRepo) {
  let eagerLoading = [];
  mapDirProperties(template, (prop) => {
    if (!eagerLoading.includes(prop)) {
      eagerLoading.push(prop);
    }
  });
  eagerLoading = eagerLoading.map(el => el.split('.'));
  let opts = {forceEnrichment: eagerLoading};
  return dataRepo.getItem(cn, id, opts);
}

/**
 * @param {String} template
 * @param {String} className
 * @param {String} id
 * @param {String} property
 * @param {DataRepository} dataRepo
 * @param {Boolean} isUrl
 * @returns {Promise.<String|null>}
 */
function produceDirName(template, className, id, property, dataRepo, isUrl) {
  if (!template || !className)
    return Promise.resolve(null);
  const itemGetter = id ? ensureItemProperties(template, className, id, dataRepo) : Promise.resolve(null);
  return itemGetter.then(item => parseDirName(template, className, id, property, item, isUrl));
}

module.exports.mapDirProperties = mapDirProperties;
module.exports.parseDirName = parseDirName;
exports.produceDirName = produceDirName;
