/**
 * Created by krasilneg on 11.01.17.
 */
'use strict';
const PropertyTypes = require('core/PropertyTypes');
const cast = require('core/cast');
const geoOperations = ['$geoWithin', '$geoIntersects'];

// jshint maxparams: 12, maxstatements: 60, maxcomplexity: 30

/**
 * @param {*} value
 * @param {{ type: Number, refClass: String }} pm
 * @param {String} ns
 * @returns {*}
 */
function castValue(value, pm, ns) {
  if (value === null) {
    return value;
  }
  if (pm.type === PropertyTypes.REFERENCE) {
    if (!value) {
      return null;
    }

    var refkey = pm._refClass.getPropertyMeta(pm._refClass.getKeyProperties()[0]);

    if (refkey) {
      return castValue(value, refkey, ns);
    }
    return value;
  } else if (pm.type === PropertyTypes.BOOLEAN) {
    if (value === null) {
      if (pm.nullable) {
        return null;
      } else {
        return false;
      }
    }
  } else if (value === null) {
    return value;
  }

  return cast(value, pm.type);
}

module.exports.castValue = castValue;

/**
 * @param {ClassMeta} cm
 * @param {Object} data
 * @param {Boolean} [setCollections]
 * @param {{}} [refUpdates]
 * @return {Object | null}
 */
function formUpdatedData(cm, data, setCollections, refUpdates) {
  var updates, pm, nm, dot, tmp;
  updates = {};
  var empty = true;
  for (nm in data) {
    if (data.hasOwnProperty(nm)) {
      empty = false;
      if ((dot = nm.indexOf('.')) >= 0) {
        if (refUpdates) {
          tmp = nm.substring(0, dot);
          pm = cm.getPropertyMeta(tmp);
          if (pm) {
            if (pm.type === PropertyTypes.REFERENCE) {
              if (!refUpdates.hasOwnProperty(tmp)) {
                refUpdates[tmp] = {};
              }
              refUpdates[tmp][nm.substring(dot + 1)] = data[nm];
            }
          }
        }
      } else {
        pm = cm.getPropertyMeta(nm);
        if (pm) {
          if (pm.type !== PropertyTypes.COLLECTION) {
            data[nm] = castValue(data[nm], pm, cm.namespace);
            if (!(pm.type === PropertyTypes.REFERENCE && pm.backRef)) {
              updates[nm] = data[nm];
            }
          } else if (setCollections && Array.isArray(data[nm]) && !pm.backRef) {
            updates[nm] = data[nm];
          }
        }
      }
    }
  }
  if (empty) {
    return null;
  }
  return updates;
}

module.exports.formDsUpdatedData = formUpdatedData;

/**
 * @param {ClassMeta} cm
 * @returns {String}
 */
function tn(cm, nsSep) {
  nsSep = nsSep || '_';
  return (cm.getNamespace() ? cm.getNamespace() + nsSep : '') + cm.getName();
}

module.exports.classTableName = tn;

/**
 * @param {ClassMeta} cm
 * @param {{}} context
 * @param {String} attr
 * @param {String} operation
 * @param {{className: String, collectionName: String, property: String, filter: {}}} options
 * @param {Array} fetchers
 * @param {DataSource} ds
 * @param {String} [nsSep]
 */
function prepareAgregOperation(cm, context, attr, operation, options, fetchers, ds, nsSep) {
  var cn;
  if (options.className) {
    cn = options.className;
  } else if (options.collectionName) {
    cn = cm.getPropertyMeta(options.collectionName)._refClass.getCanonicalName();
  }

  var oper = {};
  oper[operation.substring(1)] = options.property;

  var result = ds.aggregate(
        tn(cn, nsSep),
        {
          filter: options.filter,
          aggregations: {
            val: oper
          }
        }
      ).
      then(
        function (result) {
          context[attr] = result.val;
          return Promise.resolve();
        }
      );

  fetchers.push(result);
  return result;
}

/**
 * @param {ClassMeta} cm
 * @param {{type: Number, binding: String, backRef: String}} pm
 * @param {{}} filter
 * @param {String} nm
 * @param {Array} fetchers
 * @param {Array} containCheckers
 * @param {DataSource} ds
 * @param {KeyProvider} keyProvider
 * @param {String} [nsSep]
 */
function prepareContains(cm, pm, filter, nm, fetchers, containCheckers, ds, keyProvider, nsSep) {
  var colMeta = pm._refClass;
  var tmp = prepareFilterOption(colMeta, filter[nm].$contains, fetchers, ds, keyProvider, nsSep, filter, nm);
  if (!pm.backRef && colMeta.getKeyProperties().length > 1) {
    throw new Error('Условия на коллекции на составных ключах не поддерживаются!');
  }
  containCheckers.push({
    $joinExists: {
      table: tn(colMeta, nsSep),
      many: !pm.backRef,
      left: pm.backRef ? (pm.binding ? pm.binding : cm.getKeyProperties()[0]) : pm.name,
      right: pm.backRef ? pm.backRef : colMeta.getKeyProperties()[0],
      filter: tmp
    }
  });
}

/**
 * @param {ClassMeta} cm
 * @param {String[]} path
 * @param {{}} filter
 * @param {String} nm
 * @param {Array} fetchers
 * @param {{}} linkedCheckers
 * @param {DataSource} ds
 * @param {KeyProvider} keyProvider
 * @param {String} nsSep
 */
function prepareLinked(cm, path, filter, nm, fetchers, linkedCheckers, ds, keyProvider, nsSep) {
  var i, lc, rMeta, n;
  var pm = cm.getPropertyMeta(path[0]);
  if (pm && pm.type === PropertyTypes.REFERENCE && path.length > 1) {
    rMeta = pm._refClass;
    if (!pm.backRef && rMeta.getKeyProperties().length > 1) {
      throw new Error('Условия на ссылки на составных ключах не поддерживаются!');
    }
    if (linkedCheckers.hasOwnProperty(path[0])) {
      lc = linkedCheckers[path[0]];
    } else {
      lc = {
        $joinExists: {
          table: tn(rMeta),
          many: false,
          left: pm.backRef ? cm.getKeyProperties()[0] : pm.name,
          right: pm.backRef ? pm.backRef : rMeta.getKeyProperties()[0],
          filter: null,
          forAttr: pm.name
        }
      };
      linkedCheckers[path[0]] = lc;
    }

    var f = lc.$joinExists.filter || {$and: []};
    var fo;
    if (path.length === 2) {
      fo = {};
      fo[path[1]] = prepareFilterOption(rMeta, filter[nm], fetchers, ds, keyProvider, nsSep, fo, path[1]);
      f.$and.push(fo);
    } else {
      var joins = {};
      for (i = 0; i < f.$and.length; i++) {
        if (f.$and[i].hasOwnProperty('$joinExists')) {
          joins[f.$and[i].$joinExists.forAttr] = f.$and[i];
        }
      }
      prepareLinked(rMeta, path.slice(1), filter, nm, fetchers, joins, ds, keyProvider, nsSep);
      for (n in joins) {
        if (joins.hasOwnProperty(n)) {
          if (f.$and.indexOf(joins[n]) < 0) {
            f.$and.push(joins[n]);
          }
        }
      }
    }
    if (f.$and.length) {
      lc.$joinExists.filter = f;
    }
  }
}

/**
 * @param {ClassMeta} cm
 * @param {{}} filter
 * @param {Array} fetchers
 * @param {DataSource} ds
 * @param {KeyProvider} keyProvider
 * @param {String} nsSep
 * @param {{}} [parent]
 * @param {String} [part]
 * @param {{}} [propertyMeta]
 * @returns {*}
 */
function prepareFilterOption(cm, filter, fetchers, ds, keyProvider, nsSep, parent, part, propertyMeta) {
  var i, knm, nm, keys, pm, emptyResult, result, containCheckers, linkedCheckers;
  if (geoOperations.indexOf(part) !== -1) {
    return filter;
  } else if (filter && Array.isArray(filter)) {
    result = [];
    for (i = 0; i < filter.length; i++) {
      result.push(prepareFilterOption(cm, filter[i], fetchers, ds, keyProvider, nsSep, result, i));
    }
    return result;
  } else if (filter && typeof filter === 'object' && !(filter instanceof Date)) {
    result = {};
    containCheckers = [];
    linkedCheckers = {};
    emptyResult = true;
    for (nm in filter) {
      if (filter.hasOwnProperty(nm)) {
        if ((pm = cm.getPropertyMeta(nm)) !== null) {
          if (pm.type === PropertyTypes.COLLECTION) {
            for (knm in filter[nm]) {
              if (filter[nm].hasOwnProperty(knm) && knm === '$contains') {
                prepareContains(cm, pm, filter, nm, fetchers, containCheckers, ds, keyProvider);
                break;
              }
            }
          } else {
            result[nm] = prepareFilterOption(cm, filter[nm], fetchers, ds, keyProvider, nsSep, result, nm, pm);
            emptyResult = false;
          }
        } else if (nm === '$ItemId') {
          if (typeof filter[nm] === 'string') {
            keys = formUpdatedData(cm, keyProvider.keyToData(cm.getName(), filter[nm], cm.getNamespace()));
            for (knm in keys) {
              if (keys.hasOwnProperty(knm)) {
                result[knm] = keys[knm];
                emptyResult = false;
              }
            }
          } else {
            result[cm.getKeyProperties()[0]] = filter[nm];
            emptyResult = false;
          }
        } else if (['$min', '$max', '$avg', '$sum', '$count'].indexOf(nm) >= 0) {
          result[nm] = prepareAgregOperation(cm, parent, part, nm, filter[nm], fetchers, ds, nsSep);
          emptyResult = false;
        } else if (nm === '$exists') {
          result[nm] = filter[nm];
          emptyResult = false;
        } else if (nm.indexOf('.') > 0) {
          prepareLinked(cm, nm.split('.'), filter, nm, fetchers, ds, keyProvider, linkedCheckers);
        } else {
          result[nm] = prepareFilterOption(cm, filter[nm], fetchers, ds, keyProvider, nsSep, result, nm, propertyMeta);
          emptyResult = false;
        }
      }
    }

    for (nm in linkedCheckers) {
      if (linkedCheckers.hasOwnProperty(nm)) {
        containCheckers.push(linkedCheckers[nm]);
      }
    }

    if (containCheckers.length) {
      if (!emptyResult) {
        containCheckers.push(result);
      }
      return {
        $and: containCheckers
      };
    }

    if (emptyResult) {
      return null;
    }

    return result;
  }

  if (propertyMeta) {
    return castValue(filter, propertyMeta, cm.getNamespace());
  }

  return filter;
}

/**
 * @param {ClassMeta} cm
 * @param {{}} filter
 * @param {DataSource} ds
 * @param {KeyProvider} keyProvider
 * @param {String} [nsSep]
 * @returns {Promise}
 */
function prepareFilterValues(cm, filter, ds, keyProvider, nsSep) {
  var fetchers = [];
  var result = prepareFilterOption(cm, filter, fetchers, ds, keyProvider, nsSep);
  return Promise.all(fetchers).
  then(function () {return Promise.resolve(result);});
}

module.exports.prepareDsFilter = prepareFilterValues;
