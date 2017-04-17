/**
 * Created by krasilneg on 11.01.17.
 */
'use strict';
const PropertyTypes = require('core/PropertyTypes');
const cast = require('core/cast');
const strToDate = require('core/strToDate');
const ConditionParser = require('core/ConditionParser');
const drOperations = require('core/DataRepoOperations');
const dsOperations = require('core/DataSourceOperations');

const geoOperations = [drOperations.GEO_WITHIN, drOperations.GEO_INTERSECTS];
const aggregOperations = [drOperations.MIN, drOperations.MAX, drOperations.AVG, drOperations.SUM, drOperations.COUNT];

// jshint maxparams: 12, maxstatements: 60, maxcomplexity: 60, maxdepth: 15

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
    return {[drOperations.IN]: [pn, filter]};
  } else {
    let filter = [];
    ids.forEach(function (id) {
      filter.push(keyProvider.keyToData(cm, id));
    });
    return {[drOperations.OR]: filter};
  }
}

module.exports.filterByItemIds = filterByItemIds;

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
  return [
    tn(colMeta),
    pm.backRef ? (pm.binding ? pm.binding : cm.getKeyProperties()[0]) : pm.name,
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
  var dotpos = nm.indexOf('.');
  if (dotpos > 0) {
    let pm = cm.getPropertyMeta(nm.substring(0, dotpos));
    if (pm && (pm.type === PropertyTypes.REFERENCE || pm.type === PropertyTypes.COLLECTION)) {
      return findPm(pm._refClass, nm.substring(dotpos + 1));
    }
  }
  return cm.getPropertyMeta(nm);
}

/**
 * @param {ClassMeta} cm
 * @param {{}} filter
 * @param {Array} fetchers
 * @param {DataSource} ds
 * @param {KeyProvider} keyProvider
 * @param {String} [nsSep]
 */
function prepareContains(cm, filter, fetchers, ds, keyProvider, nsSep) {
  var pm = findPm(cm, filter[0]);
  var colMeta = pm._refClass;
  var tmp = prepareFilterOption(colMeta, filter[1], fetchers, ds, keyProvider, nsSep);
  if (!pm.backRef && colMeta.getKeyProperties().length > 1) {
    throw new Error('Условия на коллекции на составных ключах не поддерживаются!');
  }
  return {$joinExists: join(pm, cm, colMeta, tmp)};
}

/**
 * @param {ClassMeta} cm
 * @param {{}} filter
 * @param {Boolean} empty
 * @returns {{}}
 */
function prepareEmpty(cm, filter, empty) {
  var pm = findPm(cm, filter[0]);
  if (pm.type === PropertyTypes.COLLECTION) {
    let colMeta = pm._refClass;
    if (!pm.backRef && colMeta.getKeyProperties().length > 1) {
      throw new Error('Условия на коллекции на составных ключах не поддерживаются!');
    }

    if (empty) {
      return {$joinNotExists: join(pm, cm, colMeta, null)};
    } else {
      return {$joinExists: join(pm, cm, colMeta, null)};
    }
  } else {
    return {[empty ? dsOperations.EMPTY : dsOperations.NOT_EMPTY]: [filter[0]]};
  }
}

/**
 * @param {ClassMeta} cm
 * @param {String[]} path
 * @param {{}} joins
 * @param {NumGenerator} numGen
 * @returns {{}}
 */
function prepareLinked(cm, path, joins, numGen) {
  var lc = null;
  var pm = cm.getPropertyMeta(path[0]);
  if (pm && (pm.type === PropertyTypes.REFERENCE || pm.type === PropertyTypes.COLLECTION) && path.length > 1) {
    let rMeta = pm._refClass;
    if (!pm.backRef && rMeta.getKeyProperties().length > 1) {
      throw new Error('Условия на ссылки на составных ключах не поддерживаются!');
    }
    let tbl = tn(rMeta);
    let alias = '';
    if (!joins.hasOwnProperty(tbl)) {
      alias = 'ref_join_' + numGen.next();
      joins.push({
        table: tn(rMeta),
        many: pm.type === PropertyTypes.COLLECTION && !pm.backRef,
        left: pm.backRef ? (pm.binding ? pm.binding : cm.getKeyProperties()[0]) : pm.name,
        right: pm.backRef ? pm.backRef : rMeta.getKeyProperties()[0],
        filter: null,
        alias: alias
      });
    } else {
      alias = joins[tbl].alias;
    }

    if (path.length === 2) {
      return '$' + alias + '.' + path[1];
    } else {
      return prepareLinked(rMeta, path.slice(1), joins, numGen);
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
function prepareOperArgs(cm, args, joins, numGen) {
  var result = [];
  args.forEach(function (arg) {
    if (typeof arg === 'string' && arg[0] === '$' && arg.indexOf('.')) {
      result.push(prepareLinked(cm, arg.substr(1).split('.'), joins, numGen));
    } else if (typeof arg === 'object' && arg !== null && !(arg instanceof Date)) {
      result.push(prepareFilterOption(cm, arg, joins, numGen));
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
function prepareFilterOption(cm, filter, joins, numGen) {
  for (let oper in filter) {
    if (filter.hasOwnProperty(oper)) {
      switch (oper) {
        case drOperations.CONTAINS:
          return prepareContains(cm, filter[oper]);
        case drOperations.NOT_EMPTY:
        case drOperations.EMPTY:
          return prepareEmpty(cm, filter[oper], oper === drOperations.EMPTY);
        case drOperations.MAX:
        case drOperations.MIN:
        case drOperations.SUM:
        case drOperations.AVG:
        case drOperations.COUNT:
        break;
        case drOperations.EQUAL:
          return {[dsOperations.EQUAL]: prepareOperArgs(cm, filter[oper], joins, numGen)};
        case drOperations.NOT_EQUAL:
          return {[dsOperations.NOT_EQUAL]: prepareOperArgs(cm, filter[oper], joins, numGen)};
        case drOperations.LIKE:
          return {[dsOperations.LIKE]: prepareOperArgs(cm, filter[oper], joins, numGen)};
        case drOperations.LESS:
          return {[dsOperations.LESS]: prepareOperArgs(cm, filter[oper], joins, numGen)};
        case drOperations.MORE:
          return {[dsOperations.MORE]: prepareOperArgs(cm, filter[oper], joins, numGen)};
        case drOperations.LESS_OR_EQUAL:
          return {[dsOperations.LESS_OR_EQUAL]: prepareOperArgs(cm, filter[oper], joins, numGen)};
        case drOperations.MORE_OR_EQUAL:
          return {[dsOperations.MORE_OR_EQUAL]: prepareOperArgs(cm, filter[oper], joins, numGen)};
        case drOperations.IN:
          return {[dsOperations.IN]: prepareOperArgs(cm, filter[oper], joins, numGen)};
        case drOperations.AND:
          return {[dsOperations.AND]: prepareOperArgs(cm, filter[oper], joins, numGen)};
        case drOperations.OR:
          return {[dsOperations.OR]: prepareOperArgs(cm, filter[oper], joins, numGen)};
        case drOperations.NOT:
          return {[dsOperations.NOT]: prepareOperArgs(cm, filter[oper], joins, numGen)};
        case drOperations.DATE:
          return {[dsOperations.DATE]: prepareOperArgs(cm, filter[oper], joins, numGen)};
        case drOperations.DATEADD:
          return {[dsOperations.DATEADD]: prepareOperArgs(cm, filter[oper], joins, numGen)};
        case drOperations.DATEDIFF:
          return {[dsOperations.DATEDIFF]: prepareOperArgs(cm, filter[oper], joins, numGen)};
        case drOperations.ADD:
          return {[dsOperations.ADD]: prepareOperArgs(cm, filter[oper], joins, numGen)};
        case drOperations.SUB:
          return {[dsOperations.SUB]: prepareOperArgs(cm, filter[oper], joins, numGen)};
        case drOperations.MUL:
          return {[dsOperations.MUL]: prepareOperArgs(cm, filter[oper], joins, numGen)};
        case drOperations.DIV:
          return {[dsOperations.DIV]: prepareOperArgs(cm, filter[oper], joins, numGen)};
        case drOperations.ROUND:
          return {[dsOperations.ROUND]: prepareOperArgs(cm, filter[oper], joins, numGen)};
        case drOperations.CONCAT:
          return {[dsOperations.CONCAT]: prepareOperArgs(cm, filter[oper], joins, numGen)};
        case drOperations.SUBSTR:
          return {[dsOperations.SUBSTR]: prepareOperArgs(cm, filter[oper], joins, numGen)};
        case drOperations.MOD:
          return {[dsOperations.MOD]: prepareOperArgs(cm, filter[oper], joins, numGen)};
        case drOperations.ABS:
          return {[dsOperations.ABS]: prepareOperArgs(cm, filter[oper], joins, numGen)};
        case drOperations.FULL_TEXT_MATCH:
          return {
            [dsOperations.FULL_TEXT_MATCH]: prepareOperArgs(cm, filter[oper], joins, numGen)
          };
        case drOperations.GEO_WITHIN:
          return {[dsOperations.GEO_WITHIN]: prepareOperArgs(cm, filter[oper], joins, numGen)};
        case drOperations.GEO_INTERSECTS:
          return {
            [dsOperations.GEO_INTERSECTS]: prepareOperArgs(cm, filter[oper], joins, numGen)
          };
        default:
          throw new Error('Некорректный тип операции!');
      }
    }
  }
}

/**
 * @param {ClassMeta} cm
 * @param {{}} filter
 * @param {{}} joins
 * @param {DataSource} ds
 * @returns {Promise}
 */
function prepareFilterValues(cm, filter, joins, ds) {
  try {
    var fetchers = [];
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
        or.push({[drOperations.EQUAL]: [aname, cast(spList[j].key, pm.type)]});
      }
    }
  } else if (pm.selectionProvider.type === 'MATRIX') {
    for (let k = 0; k < pm.selectionProvider.matrix.length; k++) {
      let spList = pm.selectionProvider.matrix[k].result;
      let spOr = [];
      for (let j = 0; j < spList.length; j++) {
        if (svre.test(spList[j].value)) {
          spOr.push({[drOperations.EQUAL]: [aname, cast(spList[j].key, pm.type)]});
        }
      }
      if (spOr.length) {
        if (spOr.length === 1) {
          spOr = spOr[0];
        } else if (spOr.length > 1) {
          spOr = {[drOperations.OR]: spOr};
        }
        or.push({
          [drOperations.AND]: [
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
 * @param {Boolean} [asString]
 * @returns {RegExp | String}
 */
function createSearchRegexp(search, asString) {
  var result = search.replace(/[\[\]\.\*\(\)\\\/\?\+\$\^]/g, '\\$0').replace(/\s+/g, '\\s+');
  if (asString) {
    return result;
  }
  return new RegExp(result);
}

function attrSearchFilter(cm, pm, or, sv, lang, prefix, depth) {
  var floatv, datev;

  if (pm.selectionProvider) {
    spFilter(cm, pm, or, createSearchRegexp(sv), prefix);
  } else if (pm.type === PropertyTypes.REFERENCE) {
    if (depth > 0) {
      searchFilter(pm._refClass, or, pm._refClass.getSemanticAttrs(), sv, lang, false,
        (prefix || '') + pm.name + '.', depth - 1);
    }
  } else if (pm.type === PropertyTypes.COLLECTION) {
    if (depth > 0) {
      let cor = [];
      searchFilter(pm._refClass, cor, pm._refClass.getSemanticAttrs(), sv, lang, false, depth - 1);
      if (cor.length) {
        let aname = '$' + (prefix || '') + pm.name;
        or.push({[drOperations.CONTAINS]: [aname, {[drOperations.OR]: cor}]});
      }
    }
  } else {
    let aname = '$' + (prefix || '') + pm.name;
    if (pm.indexed && !pm.formula) {
      if (
        pm.type === PropertyTypes.STRING ||
        pm.type === PropertyTypes.URL ||
        pm.type === PropertyTypes.TEXT ||
        pm.type === PropertyTypes.HTML
      ) {
        if (!pm.autoassigned) {
          or.push({[drOperations.LIKE]: [aname, sv]});
        }
      } else if (!isNaN(floatv = parseFloat(sv)) && (
          pm.type === PropertyTypes.INT ||
          pm.type === PropertyTypes.DECIMAL ||
          pm.type === PropertyTypes.REAL
        )
      ) {
        if (String(floatv) === sv) {
          or.push({[drOperations.EQUAL]: [aname, floatv]});
        }
      } else if (
        (datev = strToDate(sv, lang)) &&
        pm.type === PropertyTypes.DATETIME
      ) {
        or.push({[drOperations.EQUAL]: [aname, datev]});
      }
    }
  }
}

/**
 * @param {ClassMeta} cm
 * @param {Array} or
 * @param {Array} attrs
 * @param {String} sv
 * @param {String} lang
 * @param {Boolean} [useFullText]
 */
function searchFilter(cm, or, attrs, sv, lang, useFullText, prefix, depth) {
  var fullText = false;

  var tmp = [];
  attrs.forEach(function (nm) {
    if (nm.indexOf('.') >= 0) {
      var path = nm.split('.');
      var p = null;
      var cm2 = cm;
      for (var i = 0; i < path.length; i++) {
        p = cm2.getPropertyMeta(path[i]);
        if (p && p.type === PropertyTypes.REFERENCE) {
          cm2 = p._refClass;
        } else if (i < path.length - 1) {
          p = null;
          break;
        }
      }
      if (p) {
        attrSearchFilter(cm, p, tmp, sv, lang, (prefix || '') + path.slice(0, path.length - 1).join('.') + '.', depth);
      }
    } else {
      var pm = cm.getPropertyMeta(nm);
      if (pm.indexSearch && useFullText) {
        fullText = true;
      }
      attrSearchFilter(cm, pm, tmp, sv, lang, prefix, depth);
    }
  });

  if (fullText) {
    /*
    Var tmp2 = tmp;
    tmp = [];
    tmp2.forEach(function (o) {
      if (o.hasOwnProperty(drOperations.CONTAINS)) {
        return;
      }

      for (var nm in o) {
        if (nm.indexOf('.') > 0) {
          return;
        }
      }

      tmp.push(o);
    });
    */
    tmp.push({[drOperations.FULL_TEXT_MATCH]: [sv]});
  }

  Array.prototype.push.apply(or, tmp);
}

module.exports.textSearchFilter = searchFilter;

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
          fids.push(item.base[nm]);
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
          if (Array.isArray(item.base[nm])) {
            for (var i = 0; i < item.base[nm].length; i++) {
              fids.push(item.base[nm][i]);
              if (!attrs.hasOwnProperty('f_' + item.base[nm][i])) {
                attrs['f_' + item.base[nm][i]] = [];
              }
              attrs['f_' + item.base[nm][i]].push({attr: nm, index: i});
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
  for (var i = 0; i < props.length; i++) {
    if (props[i]._formula) {
      calculations.push(props[i]._formula.apply(item, [{}]));
      calcNames.push(props[i].name);
    }
  }

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
