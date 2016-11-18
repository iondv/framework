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
   * @returns {String}
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

  KeyProvider.apply(this);
}

module.exports = MetaKeyProvider;
