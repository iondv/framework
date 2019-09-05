const moment = require('moment');
const path = require('path');
const PropertyTypes = require('core/PropertyTypes');

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
  if (!str) {
    return null;
  }
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
    if (moments[1]) {
      result = result.replace(new RegExp(`\\$\\{${moments[1]}\\}`, 'g'), m.format(moments[1]));
    }
    moments = regx.exec(result);
  }
  return path.normalize(result);
}

module.exports.parseDirName = parseDirName;

function fileProperties(cm) {
  const props = cm.getPropertyMetas();
  const fileProps = [PropertyTypes.FILE, PropertyTypes.IMAGE, PropertyTypes.FILE_LIST];
  return props
    .filter(p => fileProps.includes(p.type))
    .map(p => p.name);
}

/**
 * @param {{}} options
 * @param {DataRepository} options.dataRepo
 * @param {MetaRepository} options.metaRepo
 * @param {{}} [options.storageSettings]
 * @param {String} className
 * @param {String} id
 * @param {String[]} propertyNames
 * @returns {Promise.<Item>}
 */
function getEnrichedItem(options, className, id, propertyNames) {
  if (!options.dataRepo || !options.metaRepo) {
    return Promise.reject(new Error('no proper options for "getEnrichedItem" provided'));
  }
  if (!id) {
    return Promise.resolve(null);
  }
  const cm = options.metaRepo.getMeta(className);
  const storageSettings = options.storageSettings || {};
  const eagerLoading = [];
  const pNames = Array.isArray(propertyNames) ? propertyNames : fileProperties(cm);
  if (storageSettings && storageSettings[className]) {
    pNames.forEach((pn) => {
      if (storageSettings[className][pn]) {
        mapDirProperties(storageSettings[className][pn], (prop) => {
          if (!eagerLoading.includes(prop)) {
            eagerLoading.push(prop);
          }
        });
      }
    });
  }
  const forceEnrichment = eagerLoading.map(el => el.split('.'));
  return options.dataRepo.getItem(className, id, {forceEnrichment});
}

exports.getEnrichedItem = getEnrichedItem;

/**
 * @param {String} className
 * @param {String} id
 * @param {String} property
 * @param {{}} options
 * @param {DataRepository} options.dataRepo
 * @param {MetaRepository} options.metaRepo
 * @param {{}} [options.storageSettings]
 * @param {Item} [item]
 * @param {String[]} propertyNames
 * @returns {Promise.<String|null>}
 */
function getStorageDir(className, id, property, options, item) {
  if (!options.dataRepo || !options.metaRepo) {
    return Promise.reject(new Error('no proper options "getStorageDir" provided'));
  }
  const storageSettings = options.storageSettings || {};
  if (storageSettings[className] && storageSettings[className][property]) {
    const cn = className.split('.')[0];
    const itemGetter = (!item && id) ?
      getEnrichedItem(options, cn, id, [property]) :
      Promise.resolve(item);
    return itemGetter.then(item => parseDirName(storageSettings[className][property], cn, id, property, item));
  }
  return Promise.resolve(null);
}

exports.getStorageDir = getStorageDir;
