/**
 * Created by kras on 05.05.16.
 */
'use strict';

var KeyProvider = require('core/interfaces/KeyProvider');

/**
 * @param {{}} options
 * @param {MetaRepository} options.metaRepo
 */
function MetaKeyProvider(options) {
  /**
   * @type {MetaRepository}
   */
  this.meta = options.metaRepo;

  /**
   * @param {String} classname
   * @param {Object} data
   * @param {String} [namespace]
   * @returns {String | null}
   * @private
   */
  this._formKey = function (classname, data, namespace) {
    if (data === null) {
      return null;
    }
    var cm = this.meta.getMeta(classname, null, namespace);
    var result = '';
    var keyProps = cm.getKeyProperties();
    for (var i = 0; i < keyProps.length; i++) {
      if (data.hasOwnProperty(keyProps[i])) {
        result = result + (result ? '_' : '') + data[keyProps[i]];
      }
    }
    return result || null;
  };

  /**
   * @param {String} classname
   * @param {String} id
   * @param {String} [namespace]
   * @returns {{}}
   * @private
   */
  this._keyToData = function (classname, id, namespace) {
    var result = {};
    if (typeof id === 'string') {
      var cm = this.meta.getMeta(classname, null, namespace);
      var keyProps = cm.getKeyProperties();
      var parts = id.split('_');
      for (var i = 0; i < keyProps.length; i++) {
        result[keyProps[i]] = parts[i];
      }
    }
    return result;
  };

  /**
   * @param {String} classname
   * @param {String} data
   * @param {String} [namespace]
   * @returns {{} | null}
   * @private
   */
  this._keyData = function (classname, data, namespace) {
    var result = {};
    if (typeof data === 'object' && data) {
      var cm = this.meta.getMeta(classname, null, namespace);
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

  /**
   * @param {String} className
   * @param {*} id
   * @returns {{}}
   */
  this._filterByItemId = function (className, id, namespace) {
    var cm = this.meta.getMeta(className, null, namespace),
        keyProps = cm.getKeyProperties(),
        result = {},
        keys = [];
    if(id.length) {
      keys = id;
    } else {
      keys.push(id);
    }
    if (keyProps.length > 1) {
      var tmp = [],
          tmp2 = [],
          tmp3 = {},
          key = null;
      for (var i = 0; i < keys.length; i++) {
        key = this._keyToData(className, keys[i], namespace);
        tmp2 = [];
        for (var j in key) {
          if (key.hasOwnProperty(j)) {
            tmp3 = {};
            tmp3[j] = {$eq: key[j]};
            tmp2.push(tmp3);
          }
        }
        tmp.push({$and: tmp2});
      }
      result = {$or: tmp};
    } else {
      result = {};
      result[keyProps[0]] = {$in: keys};
    }
    return result;
  };

  KeyProvider.apply(this);
}

module.exports = MetaKeyProvider;
