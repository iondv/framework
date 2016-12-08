/**
 * Created by kras on 16.11.16.
 */
'use strict';
const merge = require('merge');
const PropertyTypes = require('core/PropertyTypes');
const Item = require('core/interfaces/DataRepository').Item;

// jshint maxstatements: 50, maxcomplexity: 20
/**
 * @param {*} data
 * @returns {{} | null}
 * @private
 */
function normalize(data) {
  var i;
  if (Array.isArray(data)) {
    var result = [];
    for (i = 0; i < data.length; i++) {
      result.push(normalize(data[i]));
    }
    return result;
  }

  if (data instanceof Item) {
    /**
     * @type {{}}
     */
    var item;
    item = merge(true, data.base, data.calculated);

    delete item._id;
    delete item._classVer;
    delete item._class;

    item.className = data.getMetaClass().getCanonicalName();
    var propertyMetas, pm, p;
    propertyMetas = data.getMetaClass().getPropertyMetas();
    for (i = 0; i < propertyMetas.length; i++) {
      pm = propertyMetas[i];
      if (!item.hasOwnProperty(pm.name)) {
        item[pm.name] = null;
      }

      if (pm.type === PropertyTypes.STRUCT) {
        continue;
      }

      p = data.property(pm.name);

      if (!p) {
        continue;
      }

      if (pm.type === PropertyTypes.REFERENCE) {
        var refItem = data.getAggregate(pm.name);
        if (refItem) {
          item[pm.name] = normalize(refItem);
        } else if (item[pm.name]) {
          delete item[pm.name];
        }
      } else if (pm.type === PropertyTypes.COLLECTION) {
        item[pm.name] = normalize(data.getAggregates(pm.name));
      } else if (
        pm.type === PropertyTypes.FILE ||
        pm.type === PropertyTypes.IMAGE ||
        pm.type === PropertyTypes.FILE_LIST
      ) {
        item[pm.name] = p.getValue();
      }
    }

    item._id = data.getItemId();
    return item;
  }

  return null;
}

module.exports = normalize;
