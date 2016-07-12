/**
 * Created by kras on 05.05.16.
 */
'use strict';

var KeyProvider = require('core/interfaces/KeyProvider');
var InsertPreprocessor = require('core/interfaces/InsertPreprocessor');
var PropertyTypes = require('core/PropertyTypes');
var mongo = require('mongodb');
var ObjectId = mongo.ObjectId;

/**
 * @param {MetaRepository} metaRep
 * @param {Db} connection
 */
function MongoMetaKeyProvider(metaRep, connection) {
  var _this = this;
  /**
   * @type {MetaRepository}
   */
  this.meta = metaRep;

  /**
   * @type {Db}
   */
  this.db = connection;

  /**
   * @param {String} classname
   * @param {Object} data
   * @returns {String}
   * @private
   */
  this._formKey = function (classname, data, namespace) {
    var cm = _this.meta.getMeta(classname, namespace);
    var result = '';
    var keyProps = cm.getKeyProperties();
    for (var i = 0; i < keyProps.length; i++) {
      result = result + (result ? '_' : '') + data[keyProps[i]];
    }
    return result;
  };

  this._keyToData = function (classname, id, namespace) {
    var result = {};
    if (typeof id === 'string') {
      var cm = _this.meta.getMeta(classname, namespace);
      var keyProps = cm.getKeyProperties();
      var parts = id.split('_');
      for (var i = 0; i < keyProps.length; i++) {
        result[keyProps[i]] = parts[i];
      }
    }
    return result;
  };

  this._keyData = function (classname, data, namespace) {
    var result = {};
    if ((typeof data === 'object') && data) {
      var cm = _this.meta.getMeta(classname, namespace);
      var keyProps = cm.getKeyProperties();
      for (var i = 0; i < keyProps.length; i++) {
        result[keyProps[i]] = data.hasOwnProperty(keyProps[i]) ? data[keyProps[i]] : null;
      }
    }
    return result;
  };

  /**
   * @param {String} classname
   * @param {Object} data
   * @returns {Promise}
   * @private
   */
  this._preProcess = function (classname, data, namespace) {
    return new Promise(function (resolve, reject) {
      var cm = _this.meta.getMeta(classname, namespace);
      if (cm.keys.length > 1) {
        data._id = _this._formKey(classname, data, namespace);
        resolve(data);
      } else {
        var p = null;
        for (var i = 0; i < cm.propertyMetas.length; i++) {
          if (cm.propertyMetas[i].name === cm.keys[0]) {
            p = cm.propertyMetas[i];
            break;
          }
        }

        if (p) {
          if (p.autoassigned) {
            if (p.type === PropertyTypes.INT) {
              // Data._id =
              var counters = _this.db.collection('counters');
              return counters.findOneAndUpdate(
                {_id: name},
                {$set: {$inc: {seq: 1}}},
                {upsert: true}
              ).then(function (c) {
                data._id = c.seq;
                data[p.name] = data._id;
                resolve(data);
              }).catch(reject);
            } else if (p.type === PropertyTypes.GUID) {
              data._id = new ObjectId();
              data[p.name] = data._id;
            } else if (p.type === PropertyTypes.DATETIME) {
              data._id = new Date();
              data[p.name] = data._id;
            }
          } else {
            data._id = _this._formKey(classname, data, namespace);
          }
          resolve(data);
        } else {
          reject({Error: 'Не найден ключевой атрибут класса ' + classname});
        }
      }
    });
  };

  InsertPreprocessor.apply(this);
  KeyProvider.apply(this);
}

module.exports = MongoMetaKeyProvider;
