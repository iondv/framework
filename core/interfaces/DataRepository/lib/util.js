/**
 * Created by krasilneg on 11.01.17.
 */
'use strict';
const PropertyTypes = require('core/PropertyTypes');
const DateTypes = require('core/DateTypes');
const cast = require('core/cast');
const strToDate = require('core/strToDate');
const dateOffset = require('core/util/dateOffset');
const ConditionParser = require('core/ConditionParser');
const Item = require('./Item');
const Operations = require('core/FunctionCodes');
const dsOperations = require('core/DataSourceFunctionCodes');

// jshint maxparams: 12, maxstatements: 60, maxcomplexity: 60, maxdepth: 15

function dataToFilter(data) {
  let result = [];
  for (let nm in data) {
    if (data.hasOwnProperty(nm)) {
      result.push({[Operations.EQUAL]: ['$' + nm, data[nm]]});
    }
  }
  return {[Operations.AND]: result};
}

module.exports.dataToFilter = dataToFilter;

/**
 * @param {*} value
 * @param {{ type: Number, refClass: String }} pm
 * @param {String} ns
 * @returns {*}
 */
function castValue(value, pm) {
  if (value === null) {
    return value;
  }
  if (pm.type === PropertyTypes.REFERENCE) {
    if (!value) {
      return null;
    }

    let refkey = pm._refClass.getKeyProperties();

    if (refkey.length > 1) {
      return String(value);
    }
    let rpm = pm._refClass.getPropertyMeta(refkey[0]);
    if (!rpm) {
      throw new Error(`Не найден атрибут "${refkey[0]}" класса "${pm._refClass.getCaption()}"!`);
    }
    return castValue(value, rpm);
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

  let v = cast(value, pm.type);
  if (pm.type === PropertyTypes.DATETIME && v instanceof Date) {
    v = dateOffset(v, pm.mode);
  }
  return v;
}

module.exports.castValue = castValue;

function prepareData(v) {
  if (Array.isArray(v)) {
    let result = [];
    for (let i = 0; i < v.length; i++) {
      result.push(prepareData(v[i]));
    }
    return result;
  }
  if (v instanceof Item) {
    return v.getItemId();
  }
  return v;
}

/**
 * @param {ClassMeta} cm
 * @param {Object} data
 * @param {Boolean} [setCollections]
 * @param {{}} [refUpdates]
 * @param {{}} [opts]
 * @return {Object | null}
 */
function formUpdatedData(cm, data, setCollections, refUpdates, opts) {
  let updates = {};
  let empty = true;
  for (let nm in data) {
    if (data.hasOwnProperty(nm)) {
      empty = false;
      let dot;
      if ((dot = nm.indexOf('.')) >= 0) {
        if (refUpdates) {
          if (opts) {
            opts.refUpdates = true;
          }
          let tmp = nm.substring(0, dot);
          let pm = cm.getPropertyMeta(tmp);
          if (pm) {
            if (pm.type === PropertyTypes.REFERENCE) {
              if (!refUpdates.hasOwnProperty(tmp)) {
                refUpdates[tmp] = {};
              }
              refUpdates[tmp][nm.substring(dot + 1)] = prepareData(data[nm]);
            }
          }
        }
      } else {
        let pm = cm.getPropertyMeta(nm);
        if (pm && pm.name !== '__class' && pm.name !== '__classTitle') {
          if (pm.type !== PropertyTypes.COLLECTION) {
            if (!(pm.type === PropertyTypes.REFERENCE && pm.backRef)) {
              updates[nm] = castValue(prepareData(data[nm]), pm);
            }
            if (pm.type === PropertyTypes.REFERENCE && pm.backRef) {
              if (opts) {
                opts.backRefUpdates = true;
              }
            }
          } else if (setCollections && Array.isArray(data[nm]) && !pm.backRef) {
            updates[nm] = prepareData(data[nm]);
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
  if (cm.getKeyProperties().length === 1) {
    let filter = [];
    let pn = cm.getKeyProperties()[0];
    let kp = cm.getPropertyMeta(pn);
    ids.forEach(function (id) {
      filter.push(cast(id, kp.type));
    });
    return {[Operations.IN]: ['$' + pn, filter]};
  } else {
    let filter = [];
    ids.forEach(function (id) {
      filter.push(dataToFilter(keyProvider.keyToData(cm, id)));
    });
    return {[Operations.OR]: filter};
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

function join(pm, cm, colMeta, filter, context) {
  return [
    tn(colMeta),
    (context ? context.alias + '.' : '') +
      (pm.backRef ? (pm.binding ? pm.binding : cm.getKeyProperties()[0]) : pm.name),
    pm.backRef ? pm.backRef : colMeta.getKeyProperties()[0],
    filter,
    !pm.backRef
  ];
}

/**
 * @param {ClassMeta} cm
 * @param {String} nm
 * @returns {{}}
 */
function findPm(cm, nm) {
  let dotpos = nm.indexOf('.');
  if (dotpos > 0) {
    let pm = cm.getPropertyMeta(nm.substring(0, dotpos));
    if (pm && (pm.type === PropertyTypes.REFERENCE || pm.type === PropertyTypes.COLLECTION)) {
      return findPm(pm._refClass, nm.substring(dotpos + 1));
    }
  }
  return cm.getPropertyMeta(nm);
}

function joinColl(cm, pm, joins, context, numGen) {
  let colMeta = pm._refClass;

  if (!pm.backRef && colMeta.getKeyProperties().length > 1) {
    throw new Error('Условия на коллекции на составных ключах не поддерживаются!');
  }

  let tbl = tn(colMeta);
  let j;
  if (!joins.hasOwnProperty(tbl)) {
    let alias = 'coll_join_' + numGen.next();
    j = {
      table: tbl,
      many: !pm.backRef,
      left: (context ? context.alias + '.' : '') +
      (pm.backRef ? (pm.binding ? pm.binding : cm.getKeyProperties()[0]) : pm.name),
      right: pm.backRef ? pm.backRef : colMeta.getKeyProperties()[0],
      filter: null,
      alias: alias
    };
    joins.push(j);
  } else {
    j = joins[tbl];
  }
  return j;
}


/**
 * @param {ClassMeta} cm
 * @param {{}} filter
 * @param {Array} joins
 * @param (Number} numGen
 */
function prepareContains(cm, filter, joins, numGen, context) {
  let nm = filter[0].substr(1);
  let pm = findPm(cm, nm);
  if (!pm) {
    throw new Error('Не найден атрибут ' + nm + ' класса ' + cm.getCanonicalName());
  }

  if (pm.type !== PropertyTypes.COLLECTION) {
    throw new Error('Операция contains не применима к атрибуту ' + nm + ' класса ' + cm.getCanonicalName());
  }

  return prepareFilterOption(pm._refClass, filter[1], joins, numGen, joinColl(cm, pm, joins, context, numGen));
}

/**
 * @param {ClassMeta} cm
 * @param {{}} filter
 * @param {Array} joins
 * @param (Number} numGen
 */
function prepareSize(cm, filter, joins, numGen, context) {
  if (typeof filter[0] === 'string' && filter[0][0] === '$') {
    let nm = filter[0].substr(1);
    let pm = findPm(cm, nm);
    if (!pm) {
      throw new Error('Не найден атрибут ' + nm + ' класса ' + cm.getCanonicalName());
    }

    if (pm.type !== PropertyTypes.COLLECTION) {
      return {[Operations.SIZE]: [filter[0]]};
    }

    // TODO Реализовать возможность обращения через несколько уровней вложенности

    return {[dsOperations.JOIN_SIZE]: join(pm, cm, pm._refClass, null, context)};
  }
  return {[Operations.SIZE]: prepareOperArgs(cm, filter, joins, numGen, context)};
}

/**
 * @param {ClassMeta} cm
 * @param {{}} filter
 * @param {Boolean} empty
 * @returns {{}}
 */
function prepareEmpty(cm, filter, empty, joins, numGen, context) {
  if (!filter[0] || typeof filter[0] !== 'string') {
    return empty ? true : false;
  }
  let nm = filter[0].substr(1);
  if (nm.indexOf('.') < 0) {
    let pm = findPm(cm, nm);
    if (!pm) {
      throw new Error('Не найден атрибут ' + nm + ' класса ' + cm.getCanonicalName());
    }
    if (pm.type === PropertyTypes.COLLECTION) {
      let colMeta = pm._refClass;
      if (!pm.backRef && colMeta.getKeyProperties().length > 1) {
        throw new Error('Условия на коллекции на составных ключах не поддерживаются!');
      }

      // TODO Реализовать возможность обращения через несколько уровней вложенности

      if (empty) {
        return {[dsOperations.JOIN_NOT_EXISTS]: join(pm, cm, colMeta, null, context)};
      } else {
        return {[dsOperations.JOIN_EXISTS]: join(pm, cm, colMeta, null, context)};
      }
    } else {
      return {[empty ? Operations.EMPTY : Operations.NOT_EMPTY]: ['$' + (context ? context.alias + '.' : '') + nm]};
    }
  } else {
    return {[empty ? Operations.EMPTY : Operations.NOT_EMPTY]: prepareOperArgs(cm, filter, joins, numGen, context)};
  }
}

/**
 * @param {ClassMeta} cm
 * @param {String[]} path
 * @param {{}} joins
 * @param {NumGenerator} numGen
 * @returns {{}}
 */
function prepareLinked(cm, path, joins, numGen, context) {
  let lc = null;
  let pm = cm.getPropertyMeta(path[0]);
  if (pm && (pm.type === PropertyTypes.REFERENCE || pm.type === PropertyTypes.COLLECTION) && path.length > 1) {
    let rMeta = pm._refClass;
    if (!pm.backRef && rMeta.getKeyProperties().length > 1) {
      throw new Error('Условия на ссылки на составных ключах не поддерживаются!');
    }
    let tbl = tn(rMeta);
    let alias = '';
    let j;
    if (!joins.hasOwnProperty(tbl)) {
      alias = 'ref_join_' + numGen.next();
      j = {
        table: tbl,
        many: pm.type === PropertyTypes.COLLECTION && !pm.backRef,
        left: (context ? context.alias + '.' : '') +
                (pm.backRef ? (pm.binding ? pm.binding : cm.getKeyProperties()[0]) : pm.name),
        right: pm.backRef ? pm.backRef : rMeta.getKeyProperties()[0],
        filter: null,
        alias: alias
      };
      joins.push(j);
    } else {
      alias = joins[tbl].alias;
      j = joins[tbl];
    }

    if (path.length === 2) {
      return '$' + alias + '.' + path[1];
    } else {
      return prepareLinked(rMeta, path.slice(1), joins, numGen, j);
    }
  }
  return lc;
}

/**
 * @param {ClassMeta} cm
 * @param {Array} args
 * @param {{}} joins
 * @param {NumGenerator} numGen
 * @returns {Array}
 */
function prepareOperArgs(cm, args, joins, numGen, context) {
  var result = [];
  args.forEach(function (arg) {
    if (typeof arg === 'string' && arg[0] === '$') {
      if (arg.indexOf('.') >= 0) {
        result.push(prepareLinked(cm, arg.substr(1).split('.'), joins, numGen, context));
      } else {
        result.push('$' + (context ? context.alias + '.' : '') + arg.substr(1));
      }
    } else if (arg !== null && !Array.isArray(arg) && !(arg instanceof Date) && typeof arg === 'object') {
      result.push(prepareFilterOption(cm, arg, joins, numGen, context));
    } else {
      result.push(arg);
    }
  });
  return result;
}

function NumGenerator() {
  var counter = 0;
  this.next = function () {
    counter++;
    return counter;
  };
}

/**
 * @param {ClassMeta} cm
 * @param {{}} filter
 * @param {{}} joins
 * @returns {{}}
 */
function prepareFilterOption(cm, filter, joins, numGen, context) {
  if (filter && typeof filter === 'object' && !(filter instanceof Date)) {
    let keys = Object.keys(filter);
    if (keys.length === 1 && Object.values(Operations).indexOf(keys[0]) >= 0) {
      let oper = keys[0];
      switch (oper) {
        case Operations.CONTAINS:
          return prepareContains(cm, filter[oper], joins, numGen, context);
        case Operations.SIZE:
          return prepareSize(cm, filter[oper], joins, numGen, context);
        case Operations.NOT_EMPTY:
        case Operations.EMPTY:
          return prepareEmpty(cm, filter[oper], oper === Operations.EMPTY, joins, numGen, context);
        case Operations.MAX:
        case Operations.MIN:
        case Operations.SUM:
        case Operations.AVG:
        case Operations.COUNT:
          break;
        case Operations.LITERAL:
          return {[oper]: filter[oper]};
        default:
          return {[oper]: prepareOperArgs(cm, filter[oper], joins, numGen, context)};
      }
    }
  }
  return filter;
}

/**
 * @param {ClassMeta} cm
 * @param {{}} filter
 * @param {{}} joins
 * @param {DataSource} ds
 * @returns {Promise}
 */
function prepareFilterValues(cm, filter, joins) {
  try {
    return Promise.resolve(prepareFilterOption(cm, filter, joins, new NumGenerator()));
  } catch (e) {
    return Promise.reject(e);
  }
}

module.exports.prepareDsFilter = prepareFilterValues;

function spFilter(cm, pm, or, svre, prefix) {
  var aname = '$' + (prefix || '') + pm.name;
  if (pm.selectionProvider.type === 'SIMPLE') {
    let spList = pm.selectionProvider.list;
    for (let j = 0; j < spList.length; j++) {
      if (svre.test(spList[j].value)) {
        or.push({[Operations.EQUAL]: [aname, cast(spList[j].key, pm.type)]});
      }
    }
  } else if (pm.selectionProvider.type === 'MATRIX') {
    for (let k = 0; k < pm.selectionProvider.matrix.length; k++) {
      let spList = pm.selectionProvider.matrix[k].result;
      let spOr = [];
      for (let j = 0; j < spList.length; j++) {
        if (svre.test(spList[j].value)) {
          spOr.push({[Operations.EQUAL]: [aname, cast(spList[j].key, pm.type)]});
        }
      }
      if (spOr.length) {
        if (spOr.length === 1) {
          spOr = spOr[0];
        } else if (spOr.length > 1) {
          spOr = {[Operations.OR]: spOr};
        }
        or.push({
          [Operations.AND]: [
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
        .then(() => {
          if (cor.length) {
            let aname = '$' + (prefix || '') + pm.name;
            or.push({[Operations.CONTAINS]: [aname, {[Operations.OR]: cor}]});
          }
        });
    }
  } else {
    let aname = '$' + (prefix || '') + pm.name;
    let floatv, datev;
    if (pm.indexed && !pm.formula) {
      if (
        pm.type === PropertyTypes.STRING ||
        pm.type === PropertyTypes.URL ||
        pm.type === PropertyTypes.TEXT ||
        pm.type === PropertyTypes.HTML
      ) {
        if (!pm.autoassigned) {
          or.push({[Operations.LIKE]: [aname, createSearchRegexp(sv, mode, true)]});
        }
      } else if (!isNaN(floatv = parseFloat(sv)) && (
          pm.type === PropertyTypes.INT ||
          pm.type === PropertyTypes.DECIMAL ||
          pm.type === PropertyTypes.REAL
        )
      ) {
        if (String(floatv) === sv) {
          or.push({[Operations.EQUAL]: [aname, floatv]});
        }
      } else if (
        (datev = strToDate(sv, lang)) &&
        pm.type === PropertyTypes.DATETIME
      ) {
        or.push({[Operations.EQUAL]: [aname, datev]});
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
    opts.searchByRefs.forEach((opts) => {
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
  }
  if (!Array.isArray(opts.searchBy)) {
    opts.searchBy = cm.getSemanticAttrs();
  }
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
        if (pm) {
          if (pm.indexSearch && useFullText) {
            fullText = true;
          }
          result = result ? result.then(() => attrSearchFilter(scope, cm, pm, tmp, sval, lang, prefix, d, smodes[i])) :
            attrSearchFilter(scope, cm, pm, tmp, sval, lang, prefix, d, smodes[i]);
        }
      }
    }
  });

  if (!result) {
    result = Promise.resolve();
  }
  return result.then(() => {
    if (fullText) {
      tmp.push({[Operations.FULL_TEXT_MATCH]: [sv]});
    }
    Array.prototype.push.apply(or, tmp);
  });
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
  return searchFilter(scope, cm, conds, opts, sv, lang, true, null, depth || 1)
    .then(() => {
      if (conds.length) {
        if (conds.length === 1) {
          conds = conds[0];
        } else {
          if (opts.joinBy === 'and') {
            conds = {[Operations.AND]: conds};
          } else {
            conds = {[Operations.OR]: conds};
          }
        }
        return conds;
      }
      return null;
    });
}

module.exports.textSearchFilter = textSearchFilter;

/**
 * @param {Item} item
 * @param {ResourceStorage} fileStorage
 * @param {ResourceStorage} imageStorage
 * @returns {Promise}
 */
function loadFiles(item, fileStorage, imageStorage) {
  let fids = [];
  let iids = [];
  let attrs = {};
  for (let nm in item.base) {
    if (item.base.hasOwnProperty(nm) && item.base[nm]) {
      let pm = item.classMeta.getPropertyMeta(nm);
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
          for (let i = 0; i < v.length; i++) {
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

  let loaders = [];
  loaders.push(fileStorage.fetch(fids));
  loaders.push(imageStorage.fetch(iids));

  return Promise.all(loaders)
    .then(function (files) {
        for (let k = 0; k < files.length; k++) {
          for (let i = 0; i < files[k].length; i++) {
            if (attrs.hasOwnProperty('f_' + files[k][i].id)) {
              for (let j = 0; j < attrs['f_' + files[k][i].id].length; j++) {
                let tmp = attrs['f_' + files[k][i].id][j];
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
 * @param {{}} [needed]
 * @param {Boolean} [cached]
 * @returns {Promise}
 */
function calcProperties(item, skip, needed, cached) {
  if (!item || skip) {
    return Promise.resolve(item);
  }
  let calculations = Promise.resolve();
  let props = item.getMetaClass().getPropertyMetas();
  props.forEach((p) => {
    if (p._formula && (!p.cached || cached) && (!needed || needed.hasOwnProperty(p.name))) {
      calculations = calculations.then(() => p._formula.apply(item))
        .then((result) => {
          item.calculated[p.name] = cast(result, p.type);
        });
    }
  });

  return calculations.then(() => item);
}

module.exports.calcProperties = calcProperties;
