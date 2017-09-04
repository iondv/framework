/**
 * Created by krasilneg on 11.01.17.
 */
'use strict';
const PropertyTypes = require('core/PropertyTypes');
const cast = require('core/cast');
const strToDate = require('core/strToDate');
const ConditionParser = require('core/ConditionParser');
const Item = require('./Item');

const geoOperations = ['$geoWithin', '$geoIntersects'];
const aggregOperations = ['$min', '$max', '$avg', '$sum', '$count'];

// jshint maxparams: 12, maxstatements: 60, maxcomplexity: 30, maxdepth: 15

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

    var refkey = pm._refClass.getKeyProperties();

    if (refkey.length > 1) {
      return String(value);
    } else {
      return castValue(value, pm._refClass.getPropertyMeta(refkey[0]), ns);
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
 * @param {{}} [opts]
 * @return {Object | null}
 */
function formUpdatedData(cm, data, setCollections, refUpdates, opts) {
  var updates, pm, nm, dot, tmp;
  updates = {};
  var empty = true;
  for (nm in data) {
    if (data.hasOwnProperty(nm)) {
      empty = false;
      if ((dot = nm.indexOf('.')) >= 0) {
        if (refUpdates) {
          if (opts) {
            opts.refUpdates = true;
          }
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
        if (pm && pm.name !== '__class' && pm.name !== '__classTitle') {
          if (pm.type !== PropertyTypes.COLLECTION) {
            data[nm] = castValue(data[nm], pm, cm.namespace);
            if (!(pm.type === PropertyTypes.REFERENCE && pm.backRef)) {
              updates[nm] = data[nm];
            }
            if (pm.type === PropertyTypes.REFERENCE && pm.backRef) {
              if (opts) {
                opts.backRefUpdates = true;
              }
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
 * @param {KeyProvider} keyProvider
 * @param {ClassMeta} cm
 * @param {String[]} ids
 */
function filterByItemIds(keyProvider, cm, ids) {
  if (!Array.isArray(ids)) {
    throw new Error('неправильные данные');
  }
  var filter = [];
  if (cm.getKeyProperties().length === 1) {
    var result = {};
    var pn = cm.getKeyProperties()[0];
    var kp = cm.getPropertyMeta(pn);
    ids.forEach(function (id) {
      filter.push(cast(id, kp.type));
    });
    result[pn] = {$in: filter};
    return result;
  } else {
    ids.forEach(function (id) {
      filter.push(keyProvider.keyToData(cm, id));
    });
    return {$or: filter};
  }
}

module.exports.filterByItemIds = filterByItemIds;

/**
 * @param {ClassMeta} cm
 * @returns {String}
 */
function tn(cm, nsSep) {
  if (cm.getAncestor()) {
    return tn(cm.getAncestor(), nsSep);
  }
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
function prepareAggregOperation(cm, context, attr, operation, options, fetchers, ds, nsSep) {
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

function join(pm, cm, colMeta, filter) {
  return {
    table: tn(colMeta),
    many: !pm.backRef,
    left: pm.backRef ? (pm.binding ? pm.binding : cm.getKeyProperties()[0]) : pm.name,
    right: pm.backRef ? pm.backRef : colMeta.getKeyProperties()[0],
    filter: filter
  };
}

/**
 * @param {ClassMeta} cm
 * @param {{type: Number, binding: String, backRef: String}} pm
 * @param {{}} filter
 * @param {String} nm
 * @param {Array} fetchers
 * @param {DataSource} ds
 * @param {KeyProvider} keyProvider
 * @param {String} [nsSep]
 */
function prepareContains(cm, pm, filter, nm, fetchers, ds, keyProvider, nsSep) {
  var colMeta = pm._refClass;
  var tmp = prepareFilterOption(colMeta, filter[nm].$contains, fetchers, ds, keyProvider, nsSep, filter, nm);
  if (!pm.backRef && colMeta.getKeyProperties().length > 1) {
    throw new Error('Условия на коллекции на составных ключах не поддерживаются!');
  }
  return {$joinExists: join(pm, cm, colMeta, tmp)};
}

/**
 * @param {ClassMeta} cm
 * @param {{type: Number}} pm
 * @param {{}} filter
 * @param {String} nm
 */
function prepareEmpty(cm, pm, filter, nm) {
  var colMeta = pm._refClass;
  if (!pm.backRef && colMeta.getKeyProperties().length > 1) {
    throw new Error('Условия на коллекции на составных ключах не поддерживаются!');
  }

  if (filter[nm].$empty) {
    return {$joinNotExists: join(pm, cm, colMeta, null)};
  } else {
    return {$joinExists: join(pm, cm, colMeta, null)};
  }
}

/**
 * @param {ClassMeta} cm
 * @param {String[]} path
 * @param {{}} filter
 * @param {String} nm
 * @param {Array} fetchers
 * @param {DataSource} ds
 * @param {KeyProvider} keyProvider
 * @param {String} nsSep
 */
function prepareLinked(cm, path, filter, nm, fetchers, ds, keyProvider, nsSep) {
  var lc, rMeta;
  lc = null;
  var pm = cm.getPropertyMeta(path[0]);
  if (pm && pm.type === PropertyTypes.REFERENCE && path.length > 1) {
    rMeta = pm._refClass;
    if (!pm.backRef && rMeta.getKeyProperties().length > 1) {
      throw new Error('Условия на ссылки на составных ключах не поддерживаются!');
    }
    lc = {
      $joinExists: {
        table: tn(rMeta),
        many: false,
        left: pm.backRef ? cm.getKeyProperties()[0] : pm.name,
        right: pm.backRef ? pm.backRef : rMeta.getKeyProperties()[0],
        filter: null
      }
    };

    if (path.length === 2) {
      let f = {};
      f[path[1]] = filter[nm];
      lc.$joinExists.filter = prepareFilterOption(rMeta, f, fetchers, ds, keyProvider, nsSep);
    } else {
      var je = prepareLinked(rMeta, path.slice(1), filter, nm, fetchers, ds, keyProvider, nsSep);
      if (je) {
        lc.$joinExists.join = [je.$joinExists];
      }
    }
  }
  return lc;
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
  var i, knm, nm, keys, pm, emptyResult, result, tmp;
  if (geoOperations.indexOf(part) !== -1) {
    return filter;
  } else if (filter && Array.isArray(filter)) {
    result = [];
    for (i = 0; i < filter.length; i++) {
      tmp = prepareFilterOption(cm, filter[i], fetchers, ds, keyProvider, nsSep, result, i);
      if (tmp) {
        result.push(tmp);
      }
    }
    return result;
  } else if (filter && typeof filter === 'object' && !(filter instanceof Date)) {
    result = {};
    emptyResult = true;
    for (nm in filter) {
      if (filter.hasOwnProperty(nm)) {
        if ((pm = cm.getPropertyMeta(nm)) !== null) {
          if (pm.type === PropertyTypes.COLLECTION) {
            for (knm in filter[nm]) {
              if (filter[nm].hasOwnProperty(knm)) {
                if (knm === '$contains') {
                  return prepareContains(cm, pm, filter, nm, fetchers, ds, keyProvider);
                }
                if (knm === '$empty') {
                  return prepareEmpty(cm, pm, filter, nm);
                }
              }
            }
          } else {
            result[nm === '__class' ? '_class' : nm] = prepareFilterOption(cm, filter[nm], fetchers, ds, keyProvider, nsSep, result, nm, pm);
            emptyResult = false;
          }
        } else if (nm === '$ItemId') {
          if (typeof filter[nm] === 'string') {
            keys = formUpdatedData(cm, keyProvider.keyToData(cm, filter[nm]));
            for (knm in keys) {
              if (keys.hasOwnProperty(knm)) {
                result[knm] = keys[knm];
                emptyResult = false;
              }
            }
          } if (Array.isArray(filter[nm])) {
            return filterByItemIds(keyProvider, cm, filter[nm]);
          } else {
            result[cm.getKeyProperties()[0]] = filter[nm];
            emptyResult = false;
          }
        } else if (aggregOperations.indexOf(nm) >= 0) {
          result[nm] = prepareAggregOperation(cm, parent, part, nm, filter[nm], fetchers, ds, nsSep);
          emptyResult = false;
        } else if (nm.indexOf('.') > 0) {
          return prepareLinked(cm, nm.split('.'), filter, nm, fetchers, ds, keyProvider);
        } else if (nm === '$empty' || nm === '$exists' || nm === '$regex' || nm === '$options') {
          result[nm] = filter[nm];
          emptyResult = false;
        } else {
          result[nm] = prepareFilterOption(cm, filter[nm], fetchers, ds, keyProvider, nsSep, result, nm, propertyMeta);
          emptyResult = false;
        }
      }
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

function spFilter(cm, pm, or, svre, prefix) {
  var spList, j, k, cond, aname;
  aname = (prefix || '') + pm.name;
  if (pm.selectionProvider.type === 'SIMPLE') {
    spList = pm.selectionProvider.list;
    for (j = 0; j < spList.length; j++) {
      if (svre.test(spList[j].value)) {
        cond = {};
        cond[aname] = {$eq: cast(spList[j].key, pm.type)};
        or.push(cond);
      }
    }
  } else if (pm.selectionProvider.type === 'MATRIX') {
    var spOr;
    for (k = 0; k < pm.selectionProvider.matrix.length; k++) {
      spList = pm.selectionProvider.matrix[k].result;
      spOr = [];
      for (j = 0; j < spList.length; j++) {
        if (svre.test(spList[j].value)) {
          cond = {};
          cond[aname] = {$eq: cast(spList[j].key, pm.type)};
          spOr.push(cond);
        }
      }
      if (spOr.length) {
        if (spOr.length === 1) {
          spOr = spOr[0];
        } else if (spOr.length > 1) {
          spOr = {$or: spOr};
        }
        or.push({
          $and: [
            ConditionParser(pm.selectionProvider.matrix[k].conditions, cm),
            spOr
          ]
        });
      }
    }
  }
}

/**
 * @param {String} search
 * @param {String} [mode]
 * @param {Boolean} [asString]
 * @returns {RegExp | String}
 */
function createSearchRegexp(search, mode, asString) {
  var result = search.trim().replace(/[\[\]\.\*\(\)\\\/\?\+\$\^]/g, '\\$0');
  if (mode === 'contains') {
    result = result.replace(/\s+/g, '\\s+');
  } else if (mode === 'starts') {
    result = '^' + result.replace(/\s+/g, '\\s+');
  } else if (mode === 'ends') {
    result = result.replace(/\s+/g, '\\s+') + '$';
  } else {
    result = result.replace(/\s+/g, '\\s.*');
  }
  if (asString) {
    return result;
  }
  return new RegExp(result, 'i');
}

function attrSearchFilter(scope, cm, pm, or, sv, lang, prefix, depth, mode) {
  if (pm.selectionProvider) {
    spFilter(cm, pm, or, createSearchRegexp(sv, mode), prefix);
  } else if (pm.type === PropertyTypes.REFERENCE) {
    if (depth > 0) {
      return searchFilter(scope, pm._refClass, or,
        {searchBy: pm._refClass.getSemanticAttrs()}, sv, lang, false,
        (prefix || '') + pm.name + '.', depth - 1, mode);
    }
  } else if (pm.type === PropertyTypes.COLLECTION) {
    if (depth > 0) {
      let cor = [];
      return searchFilter(scope, pm._refClass, cor,
        {
          searchBy: pm._refClass.getSemanticAttrs()
        }, sv, lang, false, '', depth - 1)
        .then(()=> {
          if (cor.length) {
            let cond = {};
            let aname = (prefix || '') + pm.name;
            cond[aname] = {$contains: {$or: cor}};
            or.push(cond);
          }
        });
    }
  } else {
    let cond = {};
    let aname = (prefix || '') + pm.name;
    let floatv, datev;
    if (pm.indexed && !pm.formula) {
      if (
        pm.type === PropertyTypes.STRING ||
        pm.type === PropertyTypes.URL ||
        pm.type === PropertyTypes.TEXT ||
        pm.type === PropertyTypes.HTML
      ) {
        if (!pm.autoassigned) {
          cond[aname] = {$regex: createSearchRegexp(sv, mode, true), $options: 'i'};
          or.push(cond);
        }
      } else if (!isNaN(floatv = parseFloat(sv)) && (
          pm.type === PropertyTypes.INT ||
          pm.type === PropertyTypes.DECIMAL ||
          pm.type === PropertyTypes.REAL
        )
      ) {
        if (String(floatv) === sv) {
          cond[aname] = {$eq: floatv};
          or.push(cond);
        }
      } else if (
        (datev = strToDate(sv, lang)) &&
        pm.type === PropertyTypes.DATETIME
      ) {
        cond[aname] = {$eq: datev};
        or.push(cond);
      }
    }
  }
  return Promise.resolve();
}

/**
 * @param {{}} scope
 * @param {{class: String, idProperties: Array}} opts
 * @param {Array} ids
 */
function fillSearchIds(scope, scm, opts, ids, sv, lang, depth) {
  return function () {
    if (!opts.class || !Array.isArray(opts.idProperties) || !opts.idProperties.length) {
      return Promise.resolve();
    }
    let cm = scope.metaRepo.getMeta(opts.class);
    return textSearchFilter(scope, cm, opts, sv, lang, true, null, depth)
      .then((filter) => {
        let lo = {filter: filter};
        lo.forceEnrichment = [];
        opts.idProperties.forEach((p) => {lo.forceEnrichment.push(p.split('.'));});
        return scope.dataRepo.getList(cm.getCanonicalName(), lo);
      })
      .then((list) => {
        list.forEach((item) => {
          opts.idProperties.forEach((pn) => {
            let p = item.property(pn);
            if (p) {
              let v = p.evaluate();
              if (!Array.isArray(v)) {
                v= [v];
              }
              v.forEach((v) => {
                if (v instanceof Item) {
                  if (v.getMetaClass().checkAncestor(scm.getCanonicalName()) && ids.indexOf(v.getItemId()) < 0) {
                    ids.push(v.getItemId());
                  }
                }
              });
            }
          });
        });
      });
  };
}

/**
 * @param {{}} scope
 * @param {ClassMeta} cm
 * @param {Array} or
 * @param {{searchBy: String[], splitBy: String, mode: String[]}} opts
 * @param {Array} [opts.searchByRefs]
 * @param {String} sv
 * @param {String} lang
 * @param {Boolean} useFullText
 * @param {String} prefix
 * @param {Number | Object} depth
 */
function searchFilter(scope, cm, or, opts, sv, lang, useFullText, prefix, depth) {
  if (Array.isArray(opts.searchByRefs) && opts.searchByRefs.length) {
    let ids = [];
    let p = null;
    opts.searchByRefs.forEach((opts)=>{
      p = p ?
        p.then(fillSearchIds(scope, cm, opts, ids, sv, lang, depth)) :
        fillSearchIds(scope, cm, opts, ids, sv, lang, depth)();
    });
    if (!p) {
      p = Promise.resolve();
    }
    return p.then(() => {
      or.push(filterByItemIds(scope.keyProvider, cm, ids));
    });
  } else if (Array.isArray(opts.searchBy)) {
    let fullText = false;

    let tmp = [];

    let svals = [];
    let smodes = opts.mode || [];
    let start = 0;
    if (opts.splitBy) {
      svals = sv.split(new RegExp(opts.splitBy));
      start = svals.length;
    }

    for (let i = 0; i < opts.searchBy.length; i++) {
      if (i >= start) {
        svals.push(opts.splitBy ? false : sv);
      }
      if (i + 1 > smodes.length) {
        smodes.push('like');
      }
    }

    let result;
    svals.forEach((sval, i) => {
      if (sval) {
        let nm = opts.searchBy[i];
        let d = depth && typeof depth === 'object' ? depth[nm] || 1 : depth;

        if (nm.indexOf('.') >= 0) {
          let path = nm.split('.');
          let p = null;
          let cm2 = cm;
          for (let j = 0; j < path.length; j++) {
            p = cm2.getPropertyMeta(path[j]);
            if (p && p.type === PropertyTypes.REFERENCE) {
              cm2 = p._refClass;
            } else if (j < path.length - 1) {
              p = null;
              break;
            }
          }
          if (p) {
            result = result ? result.then(() => {
              return attrSearchFilter(scope, cm, p, tmp, sval, lang,
                (prefix || '') + path.slice(0, path.length - 1).join('.') + '.',
                d, smodes[i]);
            }) :
              attrSearchFilter(scope, cm, p, tmp, sval, lang,
              (prefix || '') + path.slice(0, path.length - 1).join('.') + '.',
              d, smodes[i]);
          }
        } else {
          let pm = cm.getPropertyMeta(nm);
          if (pm.indexSearch && useFullText) {
            fullText = true;
          }
          result = result ? result.then(() => attrSearchFilter(scope, cm, pm, tmp, sval, lang, prefix, d, smodes[i])) :
            attrSearchFilter(scope, cm, pm, tmp, sval, lang, prefix, d, smodes[i]);
        }
      }
    });

    if (!result) {
      result = Promise.resolve();
    }
    return result.then(() => {
      if (fullText) {
        let tmp2 = tmp.slice(0);
        tmp = [];
        tmp2.forEach((o) => {
          if (o.hasOwnProperty('$contains')) {
            return;
          }

          for (let nm in o) {
            if (nm.indexOf('.') > 0) {
              return;
            }
          }

          tmp.push(o);
        });
        tmp.push(
          {
            $text: {$search: sv}
          }
        );
      }

      Array.prototype.push.apply(or, tmp);
    });
  }
}

/**
 * @param {ClassMeta} cm
 * @param {{searchBy: String[], splitBy: String, mode: String[], joinBy: String}} opts
 * @param {String} sv
 * @param {String} lang
 * @param {Boolean} useFullText
 * @param {String} prefix
 * @param {Number|Object} depth
 */
function textSearchFilter(scope, cm, opts, sv, lang, useFullText, prefix, depth) {
  let conds = [];
  return searchFilter(scope, cm, conds, opts, sv, lang, true, null, depth || 1).then(()=>{
    if (conds.length) {
      if (conds.length === 1) {
        conds = conds[0];
      } else {
        if (opts.joinBy === 'and') {
          conds = {$and: conds};
        } else {
          conds = {$or: conds};
        }
      }
      return conds;
    }
    return null;
  });
};

module.exports.textSearchFilter = textSearchFilter;

/**
 * @param {Item} item
 * @param {ResourceStorage} fileStorage
 * @param {ResourceStorage} imageStorage
 * @returns {Promise}
 */
function loadFiles(item, fileStorage, imageStorage) {
  var pm;
  var fids = [];
  var iids = [];
  var attrs = {};
  for (var nm in item.base) {
    if (item.base.hasOwnProperty(nm) && item.base[nm]) {
      pm = item.classMeta.getPropertyMeta(nm);
      if (pm) {
        if (pm.type === PropertyTypes.FILE || pm.type === PropertyTypes.IMAGE) {
          if (!attrs.hasOwnProperty('f_' + item.base[nm])) {
            attrs['f_' + item.base[nm]] = [];
          }
          attrs['f_' + item.base[nm]].push(nm);
          if (pm.type === PropertyTypes.FILE) {
            fids.push(item.base[nm]);
          } else if (pm.type === PropertyTypes.IMAGE) {
            iids.push(item.base[nm]);
          }
        } else if (pm.type === PropertyTypes.FILE_LIST) {
          let v = item.base[nm];
          if (!Array.isArray(v)) {
            v = [v];
          }
          for (var i = 0; i < v.length; i++) {
            if (v[i]) {
              fids.push(v[i]);
              if (!attrs.hasOwnProperty('f_' + v[i])) {
                attrs['f_' + v[i]] = [];
              }
              attrs['f_' + v[i]].push({attr: nm, index: i});
            }
          }
        }
      }
    }
  }
  if (fids.length === 0 && iids.length === 0) {
    return Promise.resolve(item);
  }

  var loaders = [];
  loaders.push(fileStorage.fetch(fids));
  loaders.push(imageStorage.fetch(iids));

  return Promise.all(loaders)
    .then(function (files) {
        var tmp, i, j, k;
        for (k = 0; k < files.length; k++) {
          for (i = 0; i < files[k].length; i++) {
            if (attrs.hasOwnProperty('f_' + files[k][i].id)) {
              for (j = 0; j < attrs['f_' + files[k][i].id].length; j++) {
                tmp = attrs['f_' + files[k][i].id][j];
                if (typeof tmp === 'object') {
                  if (!Array.isArray(item.files[tmp.attr])) {
                    item.files[tmp.attr] = [];
                  }
                  item.files[tmp.attr][tmp.index] = files[k][i];
                } else if (typeof tmp === 'string') {
                  item.files[tmp] = files[k][i];
                }
              }
            }
          }
        }
        return Promise.resolve(item);
      }
    );
}

module.exports.loadFiles = loadFiles;

/**
 * @param {Item} item
 * @param {Boolean} [skip]
 * @returns {Promise}
 */
function calcProperties(item, skip) {
  if (!item || skip) {
    return Promise.resolve(item);
  }
  var calculations = [];
  var calcNames = [];
  var props = item.getMetaClass().getPropertyMetas();
  props.forEach((p)=> {
    if (p._formula) {
      calculations.push(Promise.resolve().then(()=>p._formula.apply(item)));
      calcNames.push(p.name);
    }
  });

  if (calculations.length === 0) {
    return Promise.resolve(item);
  }

  return Promise.all(calculations).
  then(function (results) {
    for (var i = 0; i < calcNames.length; i++) {
      item.calculated[calcNames[i]] = results[i];
    }
    return Promise.resolve(item);
  });
}

module.exports.calcProperties = calcProperties;
