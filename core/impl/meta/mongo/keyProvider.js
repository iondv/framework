/**
 * Created by kras on 05.05.16.
 */
'use strict';

var KeyProvider = require('core/interfaces/KeyProvider');

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
   * @param {String} [namespace]
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
    if (typeof data === 'object' && data) {
      var cm = _this.meta.getMeta(classname, namespace);
      var keyProps = cm.getKeyProperties();
      for (var i = 0; i < keyProps.length; i++) {
        if (data.hasOwnProperty(keyProps[i]) && data[keyProps[i]] !== null) {
          result[keyProps[i]] = data[keyProps[i]];
        } else {
          return null;
        }
      }
    }
    return result;
  };

  KeyProvider.apply(this);
}

module.exports = MongoMetaKeyProvider;
