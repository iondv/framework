// jscs:disable requireCapitalizedComments

/**
 * Created by kras on 25.02.16.
 */
'use strict';

const DataSource = require('core/interfaces/DataSource');
const mongo = require('mongodb');
const client = mongo.MongoClient;
const LoggerProxy = require('core/impl/log/LoggerProxy');
const empty = require('core/empty');
const clone = require('clone');

const AUTOINC_COLLECTION = '__autoinc';

// jshint maxstatements: 70, maxcomplexity: 30, maxdepth: 10

/**
 * @param {{ uri: String, options: Object }} config
 * @constructor
 */
function MongoDs(config) {

  var _this = this;

  /**
   * @type {Db}
   */
  this.db = null;

  this.isOpen = false;

  this.busy = false;

  var log = config.logger || new LoggerProxy();

  var excludeNullsFor = {};

  /**
   * @returns {Promise}
   */
  function openDb() {
    return new Promise(function (resolve, reject) {
      if (_this.db && _this.isOpen) {
        return resolve(_this.db);
      } else if (_this.db && _this.busy) {
        _this.db.once('isOpen', function () {
          resolve(_this.db);
        });
      } else {
        _this.busy = true;
        client.connect(config.uri, config.options, function (err, db) {
          if (err) {
            reject(err);
          }
          try {
            _this.db = db;
            _this.db.open(function () {
              _this.busy = false;
              _this.isOpen = true;
              log.info('Получено соединение с базой: ' + db.s.databaseName + '. URI: ' + db.s.options.url);
              _this._ensureIndex(AUTOINC_COLLECTION, {type: 1}, {unique: true}).then(
                function () {
                  resolve(_this.db);
                  _this.db.emit('isOpen', _this.db);
                }
              ).catch(reject);
            });
          } catch (e) {
            _this.busy = false;
            _this.isOpen = false;
            reject(e);
          }
        });
      }
    });
  }

  this._connection = function () {
    if (this.isOpen) {
      return this.db;
    }
    return null;
  };

  this._open = function () {
    return openDb();
  };

  this._close = function () {
    return new Promise(function (resolve, reject) {
      if (_this.db && _this.isOpen) {
        _this.busy = true;
        _this.db.close(true, function (err) {
          _this.isOpen = false;
          _this.busy = false;
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  };

  /**
   * @param {String} type
   * @returns {Promise}
   */
  function getCollection(type) {
    return new Promise(function (resolve, reject) {
      openDb().then(function () {
        // Здесь мы перехватываем автосоздание коллекций, чтобы вставить хук для создания индексов, например
        _this.db.collection(type, {strict: true}, function (err, c) {
          if (!c) {
            try {
              _this.db.createCollection(type)
                .then(resolve)
                .catch(reject);
            } catch (e) {
              return reject(err);
            }
          } else {
            if (err) {
              return reject(err);
            }
            resolve(c);
          }
        });
      }).catch(reject);
    });
  }

  function getAutoInc(type) {
    return new Promise(function (resolve, reject) {
      getCollection(AUTOINC_COLLECTION).then(
        /**
         * @param {Collection} autoinc
         */
        function (autoinc) {
          autoinc.find({type: type}).limit(1).next(function (err, counters) {
            if (err) {
              return reject(err);
            }
            resolve({ai: autoinc, c: counters});
          });
        }
      ).catch(reject);
    });
  }

  function autoInc(type, data) {
    return new Promise(function (resolve, reject) {
      getAutoInc(type).then(
        /**
         * @param {{ai: Collection, c: {counters:{}, steps:{}}}} result
         */
        function (result) {
          if (result.c && result.c.counters) {
            var inc = {};
            var act = false;
            var counters = result.c.counters;
            for (var nm in counters) {
              if (counters.hasOwnProperty(nm)) {
                inc['counters.' + nm] =
                  result.c.steps && result.c.steps.hasOwnProperty(nm) ? result.c.steps[nm] : 1;
                act = true;
              }
            }

            if (act) {
              result.ai.findOneAndUpdate(
                {type: type},
                {$inc: inc},
                {returnOriginal: false, upsert: false},
                function (err, result) {
                  if (err) {
                    return reject(err);
                  }

                  for (var nm in result.value.counters) {
                    if (result.value.counters.hasOwnProperty(nm)) {
                      data[nm] = result.value.counters[nm];
                    }
                  }
                  resolve(data);
                }
              );
              return;
            }
          }
          resolve(data);
        }
      ).catch(reject);
    });
  }

  function excludeNulls(data, excludes) {
    var nm;
    var unsets = {};
    for (nm in data) {
      if (data.hasOwnProperty(nm)) {
        if (data[nm] === null && excludes.hasOwnProperty(nm)) {
          delete data[nm];
          unsets[nm] = true;
        }
      }
    }
    return {data: data, unset: unsets};
  }

  /**
   * @param {Collection} c
   * @returns {Promise}
   */
  function cleanNulls(c, type, data) {
    return new Promise(function (resolve, reject) {
      if (excludeNullsFor.hasOwnProperty(type)) {
        resolve(excludeNulls(data, excludeNullsFor[type]));
      } else {
        c.indexes(function (err, indexes) {
          if (err) {
            return reject(err);
          }
          var excludes = {};
          var i, nm;
          for (i = 0; i < indexes.length; i++) {
            if (indexes[i].unique && indexes[i].sparse) {
              for (nm in indexes[i].key) {
                if (indexes[i].key.hasOwnProperty(nm)) {
                  excludes[nm] = true;
                }
              }
            }
          }

          excludeNullsFor[type] = excludes;
          resolve(excludeNulls(data, excludeNullsFor[type]));
        });
      }
    });
  }

  function prepareGeoJSON(data) {
    var tmp, tmp2, i;
    for (var nm in data) {
      if (data.hasOwnProperty(nm)) {
        if (typeof data[nm] === 'object' && data[nm] && data[nm].type && (data[nm].geometry || data[nm].features)) {
          switch (data[nm].type) {
            case 'Feature': {
              tmp = clone(data[nm], true);
              delete tmp.geometry;
              data[nm] = data[nm].geometry;
              data['__geo__' + nm + '_f'] = tmp;
            }
              break;
            case 'FeatureCollection': {
              tmp = {
                type: 'GeometryCollection',
                geometries: []
              };
              tmp2 = clone(data[nm], true);

              for (i = 0; i < tmp2.features.length; i++) {
                tmp.geometries.push(tmp2.features[i].geometry);
                delete tmp2.features[i].geometry;
              }
              data[nm] = tmp;
              data['__geo__' + nm + '_f'] = tmp2;
            }
              break;
          }
        }
      }
    }
    return data;
  }

  this._insert = function (type, data) {
    return getCollection(type).then(
      function (c) {
        return new Promise(function (resolve, reject) {
          autoInc(type, data)
            .then(
              function (data) {
                return cleanNulls(c, type, prepareGeoJSON(data));
              }
            ).then(
              function (data) {
                c.insertOne(data.data, function (err, result) {
                  if (err) {
                    reject(err);
                  } else if (result.insertedId) {
                    _this._get(type, {_id: result.insertedId}).then(resolve).catch(reject);
                  } else {
                    reject(new Error('Inser failed'));
                  }
                });
              }
            ).catch(reject);
        });
      }
    );
  };

  function adjustAutoInc(type, data) {
    return new Promise(function (resolve, reject) {
      getAutoInc(type).then(
        /**
         * @param {{ai: Collection, c: {counters:{}, steps:{}}}} result
         */
        function (result) {
          var act = false;
          var up = {};
          if (result.c && result.c.counters) {
            var counters = result.c.counters;
            for (var nm in counters) {
              if (counters.hasOwnProperty(nm)) {
                if (counters[nm] < data[nm]) {
                  up['counters.' + nm] = data[nm];
                  act = true;
                }
              }
            }
          }

          if (!act) {
            return resolve(data);
          }

          result.ai.findOneAndUpdate(
            {type: type},
            {$set: up},
            {returnOriginal: false, upsert: false},
            function (err) {
              if (err) {
                return reject(err);
              }
              resolve(data);
            }
          );
          return;
        }
      ).catch(reject);
    });
  }

  function checkObjectId(conditions) {
    if (typeof conditions === 'object' && conditions) {
      for (var nm in conditions) {
        if (conditions.hasOwnProperty(nm)) {
          if (nm === '_id' && typeof conditions._id === 'string') {
            conditions._id = new mongo.ObjectID(conditions._id);
          } else {
            checkObjectId(conditions[nm]);
          }
        }
      }
    }
    return conditions;
  }

  function doUpdate(type, conditions, data, upsert, multi) {
    var hasData = false;
    if (data) {
      for (var nm in data) {
        if (data.hasOwnProperty(nm) &&
          typeof data[nm] !== 'undefined' &&
          typeof data[nm] !== 'function'
        ) {
          hasData = nm;
          break;
        }
      }
    }

    if (!hasData) {
      return _this._get(type, conditions);
    }

    return getCollection(type).then(
      function (c) {
        return cleanNulls(c, type, prepareGeoJSON(data))
          .then(
            function (data) {
              return new Promise(function (resolve, reject) {
                var updates = {};
                if (!empty(data.data)) {
                  updates.$set = data.data;
                }
                if (!empty(data.unset)) {
                  updates.$unset = data.unset;
                }
                checkObjectId(conditions);
                if (!multi) {
                  c.updateOne(
                    conditions,
                    updates,
                    {upsert: upsert},
                    function (err) {
                      if (err) {
                        return reject(err);
                      }
                      _this._get(type, conditions).then(function (r) {
                        if (upsert) {
                          return adjustAutoInc(type, r);
                        }
                        return resolve(r);
                      }).then(resolve).catch(reject);
                    });
                } else {
                  c.updateMany(conditions, updates,
                    function (err, result) {
                      if (err) {
                        return reject(err);
                      }
                      _this._fetch(type, {filter: conditions}).then(resolve).catch(reject);
                    });
                }
              });
            }
          );
      });
  }

  this._update = function (type, conditions, data) {
    return doUpdate(type, conditions, data, false, false);
  };

  this._upsert = function (type, conditions, data) {
    return doUpdate(type, conditions, data, true, false);
  };

  this._delete = function (type, conditions) {
    return getCollection(type).then(
      function (c) {
        return new Promise(function (resolve, reject) {
          checkObjectId(conditions);
          c.deleteMany(conditions,
            function (err, result) {
              if (err) {
                return reject(err);
              }
              resolve(result.deletedCount);
            });
        });
      }
    );
  };

  function addPrefix(nm, prefix, sep) {
    sep = sep || '.';
    return (prefix ? prefix + sep : '') + nm;
  }

  function wind(attributes) {
    var tmp, tmp2, i;
    tmp = {};
    tmp2 = {};
    for (i = 0; i < attributes.length; i++) {
      tmp[attributes[i]] = '$' + attributes[i];
      tmp2[attributes[i]] = '$_id.' + attributes[i];
    }
    return [{$group: {_id: tmp}}, {$project: tmp2}];
  }

  function clean(attributes) {
    var tmp = {};
    var i;
    for (i = 0; i < attributes.length; i++) {
      tmp[attributes[i]] = 1;
    }
    return {$project: tmp};
  }

  function joinId(join) {
    return join.table + ':' + join.left + ':' + join.right + ':' + (join.many ? 'm' : '1');
  }

  /**
   * @param {Array} attributes
   * @param {Array} joins
   * @param {Array} result
   */
  function processJoins(attributes, joins, result) {
    if (joins.length) {
      if (!attributes || !attributes.length) {
        throw new Error('Не передан список атрибутов необходимый для выполнения объединений.');
      }
      var attrs = attributes.slice(0);
      joins.forEach(function (join) {
        var tmp;
        var left = join.left;
        if (join.many) {
          left = '__uw_' + join.left;
          tmp = clean(attrs);
          tmp.$project[left] = '$' + join.left;
          attrs.push(left);
          result.push(tmp);
          result.push({$unwind: {path: '$' + left, preserveNullAndEmptyArrays: true}});
        }

        tmp = {
          from: join.table,
          localField: left,
          foreignField: join.right,
          as: join.alias
        };
        result.push({$lookup: tmp});
        attrs.push(join.alias);
        if (join.passSize) {
          tmp = clean(attrs);
          tmp.$project[join.alias + '_size'] = {$size: '$' + join.alias};
          attrs.push(join.alias + '_size');
          result.push(tmp);
        }
        result.push({$unwind: {path: '$' + join.alias, preserveNullAndEmptyArrays: true}});
      });
    }
  }

  function processJoin(attributes, joinedSources, lookups, leftPrefix, counter) {
    counter = counter || {v: 0};
    return function (join) {
      leftPrefix = leftPrefix || '';
      if (!leftPrefix && attributes.indexOf(join.left) < 0) {
        attributes.push(join.left);
      }
      if (!join.alias) {
        join.alias = '__j' + counter.v;
        counter.v++;
      }
      var jid = joinId(join);
      if (!lookups.hasOwnProperty(jid)) {
        lookups[jid] = join;
        joinedSources[join.alias] = join;
      }
      if (Array.isArray(join.join)) {
        join.join.forEach(processJoin(attributes, joinedSources, lookups, join.alias, counter));
      }
    };
  }

  /**
   * @param {Array} attributes
   * @param {{}} find
   * @param {Object[]} joins
   * @param {{}} explicitJoins
   * @param {{v:Number}} counter
   * @returns {*}
   */
  function producePrefilter(attributes, find, joins, explicitJoins, counter) {
    var result, tmp, i;
    counter = counter || {v: 0};
    if (Array.isArray(find)) {
      result = [];
      for (i = 0; i < find.length; i++) {
        tmp = producePrefilter(attributes, find[i], joins, explicitJoins, counter);
        if (tmp) {
          result.push(tmp);
        }
      }
      return result.length ? result : null;
    } else if (typeof find === 'object') {
      result = null;
      var j, jid, ja;
      var jsrc = {};
      var pj = processJoin(attributes, jsrc, explicitJoins, null, counter);
      for (var name in find) {
        if (find.hasOwnProperty(name)) {
          if (name === '$joinExists' || name === '$joinNotExists') {
            jid = joinId(find[name]);
            if (explicitJoins.hasOwnProperty(jid)) {
              j = explicitJoins[jid];
            } else {
              j = clone(find[name]);
              delete j.filter;
              j.alias = '__j' + counter.v;
              counter.v++;
            }

            find[name].alias = j.alias;
            pj(find[name]);

            for (ja in jsrc) {
              if (jsrc.hasOwnProperty(ja)) {
                joins.push(jsrc[ja]);
              }
            }

            if (find[name].filter) {
              producePrefilter(attributes, find[name].filter, joins, explicitJoins, counter);
            }
            result = true;
          } else {
            tmp = producePrefilter(attributes, find[name], joins, explicitJoins, counter);
            if (tmp) {
              if (name === '$or') {
                for (i = 0; i < tmp.length; i++) {
                  if (tmp[i] === true) {
                    result = true;
                  }
                }
                if (!result && tmp.length) {
                  result = {$or: tmp};
                }
              } else if (name === '$and') {
                result = [];
                for (i = 0; i < tmp.length; i++) {
                  if (tmp[i] !== true) {
                    result.push(tmp[i]);
                  }
                }
                result = result.length ? {$and: result} : null;
              } else {
                result = result || {};
                result[name] = tmp;
              }
            }
          }
        }
      }

      return result;
    }
    return find;
  }

  function joinPostFilter(join, explicitJoins, prefix, not) {
    var jid = joinId(join);
    var j = explicitJoins[jid];

    if (prefix) {
      j.left = addPrefix(j.left, prefix);
    }
    var f = null;
    if (join.filter || join.join) {
      f = null;
      if (join.filter) {
        f = producePostfilter(join.filter, explicitJoins, join.alias);
        if (f !== null) {
          if (not) {
            f = {$not: f};
          }
        }
      }

      if (Array.isArray(join.join)) {
        var and = [];
        var tmp;
        for (var i = 0; i < join.join.length; i++) {
          tmp = joinPostFilter(join.join[i], explicitJoins, join.alias, false);
          if (tmp) {
            and.push(tmp);
          }
        }
        if (and.length) {
          if (f) {
            and.push(f);
          }
          f = {$and: and};
        }
      }
    } else {
      f = {};
      f[j.alias + '_size'] = 0;
      j.passSize = true;
      if (!not) {
        f[j.alias + '_size'] = {$ne: 0};
      }
    }
    return f;
  }

  /**
   * @param {{}} find
   * @param {{}} explicitJoins
   * @param {String} [prefix]
   * @returns {*}
   */
  function producePostfilter(find, explicitJoins, prefix) {
    var result, tmp, i;
    if (Array.isArray(find)) {
      result = [];
      for (i = 0; i < find.length; i++) {
        tmp = producePostfilter(find[i], explicitJoins, prefix);
        if (tmp) {
          result.push(tmp);
        }
      }
      return result.length ? result : null;
    } else if (typeof find === 'object') {
      result = null;
      for (var name in find) {
        if (find.hasOwnProperty(name)) {
          if (name === '$joinExists' || name === '$joinNotExists') {
            return joinPostFilter(find[name], explicitJoins, prefix, name === '$joinNotExists');
          } else if (name === '$text') {
            return null;
          } else {
            tmp = producePostfilter(find[name], explicitJoins, prefix);
            if (tmp) {
              result = result || {};
              if (name[0] !== '$') {
                result[prefix ? addPrefix(name, prefix) : name] = tmp;
              } else {
                result[name] = tmp;
              }
            }
          }
        }
      }
      return result;
    }
    return find;
  }

  /**
   * @param {String} lexem
   * @param {String[]} attributes
   * @param {{}} joinedSources
   */
  function checkAttrLexem(lexem, attributes, joinedSources) {
    var tmp = lexem.indexOf('.') < 0 ? lexem : lexem.substr(0, lexem.indexOf('.'));
    if (tmp[0] === '$' && !joinedSources.hasOwnProperty(tmp)) {
      tmp = tmp.substr(1);
      if (attributes.indexOf(tmp) < 0) {
        attributes.push(tmp);
      }
    }
  }

  /**
   * @param {{}} expr
   * @param {String[]} attributes
   * @param {{}} joinedSources
   */
  function checkAttrExpr(expr, attributes, joinedSources) {
    if (typeof expr === 'string') {
      return checkAttrLexem(expr, attributes, joinedSources);
    }

    if (typeof expr === 'object') {
      for (var nm in expr) {
        if (expr.hasOwnProperty(nm)) {
          if (nm[0] !== '$') {
            checkAttrLexem('$' + nm, attributes, joinedSources);
          }
          checkAttrExpr(expr[nm], attributes, joinedSources);
        }
      }
    }
  }

  /**
   * @param {{}} options
   * @param {{}} [options.filter]
   * @param {{}} [options.fields]
   * @param {{}} [options.aggregates]
   * @param {{}} [options.joins]
   * @param {{}} [options.sort]
   * @param {String} [options.to]
   * @param {Number} [options.offset]
   * @param {Number} [options.count]
   * @param {Boolean} [options.countTotal]
   * @param {Boolean} [options.distinct]
   * @param {String[]} [options.select]
   * @param {Array} [forcedStages]
   * @param {Boolean} [onlyCount]
   * @returns {*}
   */
  function checkAggregation(options, forcedStages, onlyCount) {
    options.attributes = options.attributes || [];
    var i, tmp, tmp2;
    var joinedSources = {};
    var lookups = {};
    var result = [];
    var joins = [];

    if (Array.isArray(options.joins)) {
      joins = options.joins;
      options.joins.forEach(processJoin(options.attributes, joinedSources, lookups));
    }

    if (options.fields) {
      for (tmp in options.fields) {
        if (options.fields.hasOwnProperty(tmp)) {
          checkAttrExpr(options.fields[tmp], options.attributes, joinedSources);
        }
      }
    }

    if (options.aggregates) {
      for (tmp in options.aggregates) {
        if (options.aggregates.hasOwnProperty(tmp)) {
          checkAttrExpr(options.aggregates[tmp], options.attributes, joinedSources);
        }
      }
    }

    var prefilter, postfilter, jl;

    if (options.filter) {
      jl = joins.length;
      prefilter = producePrefilter(options.attributes, options.filter, joins, lookups);
      if (joins.length > jl) {
        postfilter = producePostfilter(options.filter, lookups);
      }
    }

    if (prefilter && (joins.length || options.to)) {
      result.push({$match: prefilter});
    }

    if (joins.length) {
      processJoins(options.attributes, joins, result);
      if (postfilter) {
        result.push({$match: postfilter});
      }
      Array.prototype.push.apply(result, wind(options.attributes));
    }

    if (Array.isArray(forcedStages)) {
      Array.prototype.push.apply(result, forcedStages);
    }

    if (result.length || options.to) {
      if (options.countTotal || onlyCount) {
        if (!options.attributes.length) {
          throw new Error('Не передан список атрибутов необходимый для подсчета размера выборки.');
        }

        tmp = {};
        tmp2 = {__total: '$__total'};
        for (i = 0; i < options.attributes.length; i++) {
          tmp[options.attributes[i]] = '$' + options.attributes[i];
          tmp2[options.attributes[i]] = '$data.' + options.attributes[i];
        }
        result.push({$group: {_id: tmp}});
        if (onlyCount) {
          result.push({$group: {_id: null, __total: {$sum: 1}}});
        } else {
          result.push({$group: {_id: null, __total: {$sum: 1}, data: {$addToSet: '$_id'}}});
          result.push({$unwind: {path: '$data', preserveNullAndEmptyArrays: true}});
          result.push({$project: tmp2});
        }
      }

      if (!onlyCount) {
        if (options.sort) {
          result.push({$sort: options.sort});
        }

        if (options.offset) {
          result.push({$skip: options.offset});
        }

        if (options.count) {
          result.push({$limit: options.count});
        }
      }
    }

    if (options.to) {
      result.push({$out: options.to});
    }

    if (result.length) {
      return result;
    }

    return false;
  }

  function mergeGeoJSON(data) {
    var tmp, tmp2, i;
    for (var nm in data) {
      if (data.hasOwnProperty(nm)) {
        tmp = data['__geo__' + nm + '_f'];
        if (tmp) {
          tmp2 = data[nm];
          delete data['__geo__' + nm + '_f'];
          switch (tmp.type) {
            case 'Feature': {
              tmp.geometry = tmp2;
              data[nm] = tmp;
            }
              break;
            case 'FeatureCollection': {
              for (i = 0; i < tmp2.geometries.length; i++) {
                tmp.features[i].geometry = tmp2.geometries[i];
              }
              data[nm] = tmp;
            }
              break;
          }
        }
      }
    }
    return data;
  }

  /**
   * @param {Collection} c
   * @param {{}} options
   * @param {{}} [options.filter]
   * @param {{}} [options.fields]
   * @param {{}} [options.sort]
   * @param {Number} [options.offset]
   * @param {Number} [options.count]
   * @param {Boolean} [options.countTotal]
   * @param {Boolean} [options.distinct]
   * @param {String[]} [options.select]
   * @param {Object[]} aggregate
   * @param {Function} resolve
   * @param {Function} reject
   */
  function fetch(c, options, aggregate, resolve, reject) {
    var r, flds;
    if (aggregate) {
      c.aggregate(aggregate, {}, function (err, data) {
        if (err) {
          return reject(err);
        }
        var results = data;
        if (options.countTotal) {
          results.total = data.length ? data[0].count : 0;
        }
        resolve(results, options.countTotal ? (data.length ? data[0].__total : 0) : null);
      });
    } else if (options.distinct && options.select.length === 1) {
      r = c.distinct(options.select[0], options.filter || {}, {}, function (err, data) {
        if (err) {
          return reject(err);
        }
        if (options.sort && options.sort[options.select[0]]) {
          var direction = options.sort[options.select[0]];
          data = data.sort(function compare(a, b) {
            if (a < b) {
              return -1 * direction;
            } else if (a > b) {
              return 1 * direction;
            }
            return 0;
          });
        }
        var res, stPos, endPos;
        res = [];
        stPos = options.offset || 0;
        endPos = options.count ? stPos + options.count : data.length;
        for (var i = stPos; i < endPos && i < data.length; i++) {
          var tmp = {};
          tmp[options.select[0]] = data[i];
          res.push(tmp);
        }
        resolve(res, options.countTotal ? (data.length ? data.length : 0) : null);
      });
    } else {
      flds = null;
      r = c.find(options.filter || {});

      if (options.sort) {
        r = r.sort(options.sort);
      }

      if (options.offset) {
        r = r.skip(options.offset);
      }

      if (options.count) {
        r = r.limit(options.count);
      }

      if (options.countTotal) {
        r.count(false, function (err, amount) {
          if (err) {
            r.close();
            return reject(err);
          }
          resolve(r, amount);
        });
      } else {
        resolve(r);
      }
    }

  }

  /**
   * @param {String} type
   * @param {{}} [options]
   * @param {{}} [options.filter]
   * @param {{}} [options.fields]
   * @param {{}} [options.sort]
   * @param {Number} [options.offset]
   * @param {Number} [options.count]
   * @param {Boolean} [options.countTotal]
   * @param {Boolean} [options.distinct]
   * @returns {Promise}
   */
  this._fetch = function (type, options) {
    options = options || {};
    return getCollection(type).then(
      function (c) {
        return new Promise(function (resolve, reject) {
          checkObjectId(options.filter);
          fetch(c, options, checkAggregation(options),
            function (r, amount) {
              if (Array.isArray(r)) {
                r.forEach(mergeGeoJSON);
                if (amount !== null) {
                  r.total = amount;
                }
                resolve(r);
              } else {
                r.toArray(function (err, docs) {
                  r.close();
                  if (err) {
                    return reject(err);
                  }
                  docs.forEach(mergeGeoJSON);
                  if (amount !== null) {
                    docs.total = amount;
                  }
                  resolve(docs);
                });
              }
            },
            reject
          );
        });
      }
    );
  };

  /**
   * @param {String} type
   * @param {{}} [options]
   * @param {{}} [options.filter]
   * @param {{}} [options.fields]
   * @param {{}} [options.sort]
   * @param {Number} [options.offset]
   * @param {Number} [options.count]
   * @param {Number} [options.batchSize]
   * @param {Function} cb
   * @returns {Promise}
   */
  this._forEach = function (type, options, cb) {
    options = options || {};
    return getCollection(type).then(
      function (c) {
        return new Promise(function (resolve, reject) {
          try {
            checkObjectId(options.filter);
            fetch(c, options, checkAggregation(options),
              function (r, amount) {
                if (Array.isArray(r)) {
                  r.forEach(function (d) {cb(mergeGeoJSON(d));});
                } else {
                  r.batchSize(options.batchSize || 1);
                  r.forEach(
                    function (d) {cb(mergeGeoJSON(d));},
                    function (err) {
                      r.close();
                      if (err) {
                        return reject(err);
                      }
                      resolve();
                    }
                  );
                }
              }, reject
            );
          } catch (err) {
            reject(err);
          }
        });
      }
    );
  };

  /**
   * @param {String} type
   * @param {{expressions: {}}} options
   * @param {{}} [options.filter]
   * @param {{}} [options.fields]
   * @param {{}} [options.aggregates]
   * @param {String} [options.to]
   * @returns {Promise}
   */
  this._aggregate = function (type, options) {
    options = options || {};
    return getCollection(type).then(
      function (c) {
        return new Promise(function (resolve, reject) {
          var plan = [];

          var expr = {$group: {}};
          if (options.fields) {
            expr.$group._id = options.fields;
          }

          var alias, oper;
          for (alias in options.aggregates) {
            if (options.aggregates.hasOwnProperty(alias)) {
              for (oper in options.aggregates[alias]) {
                if (options.aggregates[alias].hasOwnProperty(oper)) {
                  if (oper === '$count') {
                    expr.$group[alias] = {$sum: 1};
                  } else if (oper === '$sum' || oper === '$avg' || oper === '$min' || oper === '$max') {
                    expr.$group[alias] = {};
                    expr.$group[alias][oper] = options.aggregates[alias][oper];
                  }
                }
              }
            }
          }

          plan.push(expr);

          var attrs = {};
          if (options.fields) {
            for (alias in options.fields) {
              if (options.fields.hasOwnProperty(alias)) {
                attrs[alias] = '$_id.' + alias;
              }
            }
          }
          if (options.aggregates) {
            for (alias in options.aggregates) {
              if (options.aggregates.hasOwnProperty(alias)) {
                attrs[alias] = 1;
              }
            }
          }

          plan.push({$project: attrs});

          if (options.filter) {
            checkObjectId(options.filter);
          }

          plan = checkAggregation(options, plan);

          c.aggregate(plan, function (err, result) {
            if (err) {
              return reject(err);
            }
            resolve(result);
          });
        });
      }
    );
  };

  this._count = function (type, options) {
    return getCollection(type).then(
      function (c) {
        return new Promise(function (resolve, reject) {
          checkObjectId(options.filter);
          var opts = {};

          if (options.offset) {
            opts.skip = options.offset;
          }
          if (options.count) {
            opts.limit = options.count;
          }

          var agreg = checkAggregation(options, [], true);
          if (agreg) {
            c.aggregate(agreg, function (err, result) {
              if (err) {
                return reject(err);
              }
              var cnt = 0;
              if (result.length) {
                cnt = result[0].__total;
              }
              resolve(cnt);
            });
          } else {
            c.count(options.filter || {}, opts, function (err, cnt) {
              if (err) {
                return reject(err);
              }
              resolve(cnt);
            });
          }
        });
      }
    );
  };

  this._get = function (type, conditions) {
    return getCollection(type).then(
      function (c) {
        return new Promise(function (resolve, reject) {
          checkObjectId(conditions);
          c.find(conditions).limit(1).next(function (err, result) {
            if (err) {
              return reject(err);
            }
            resolve(mergeGeoJSON(result));
          });
        });
      });
  };

  /**
   * @param {String} type
   * @param {{}} properties
   * @param {{unique: Boolean}} [options]
   * @returns {Promise}
   */
  this._ensureIndex = function (type, properties, options) {
    return getCollection(type).then(
      function (c) {
        return new Promise(function (resolve) {
          c.createIndex(properties, options || {}, function () {
            resolve(c);
          });
        });
      });
  };

  /**
   * @param {String} type
   * @param {{}} properties
   * @returns {Promise}
   */
  this._ensureAutoincrement = function (type, properties) {
    var data = {};
    var steps = {};
    var act = false;
    if (properties) {
      for (var nm in properties) {
        if (properties.hasOwnProperty(nm)) {
          data[nm] = 0;
          steps[nm] = properties[nm];
          act = true;
        }
      }

      if (act) {
        return new Promise(function (resolve, reject) {
          getCollection(AUTOINC_COLLECTION).then(
            function (c) {
              c.findOne({type: type}, function (err, r) {
                if (err) {
                  return reject(err);
                }

                if (r && r.counters) {
                  for (var nm in r.counters) {
                    if (r.counters.hasOwnProperty(nm) && data.hasOwnProperty(nm)) {
                      data[nm] = r.counters[nm];
                    }
                  }
                }

                c.updateOne(
                  {type: type},
                  {$set: {counters: data, steps: steps}},
                  {upsert: true},
                  function (err) {
                    if (err) {
                      return reject(err);
                    }
                    resolve();
                  }
                );
              });
            }
          ).catch(reject);
        });
      }
    }
    return Promise.resolve();
  };
}

// Util.inherits(MongoDs, DataSource); //jscs:ignore requireSpaceAfterLineComment

MongoDs.prototype = new DataSource();

module.exports = MongoDs;
