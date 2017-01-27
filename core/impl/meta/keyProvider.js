/**
 * Created by kras on 05.05.16.
 */
'use strict';

const KeyProvider = require('core/interfaces/KeyProvider');
const cast = require('core/cast');

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
   * @param {ClassMeta} cm
   * @param {Object} data
   * @returns {String | null}
   * @private
   */
  this._formKey = function (cm, data) {
    if (data === null) {
      return null;
    }
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
   * @param {ClassMeta} cm
   * @param {String} id
   * @returns {{}}
   * @private
   */
  this._keyToData = function (cm, id) {
    var result = {};
    if (typeof id === 'string') {
      var keyProps = cm.getKeyProperties();
      var parts = id.split('_');
      var pm;
      for (var i = 0; i < keyProps.length; i++) {
        pm = cm.getPropertyMeta(keyProps[i]);
        result[keyProps[i]] = cast(parts[i], pm.type);
      }
    }
    return result;
  };

  /**
   * @param {ClassMeta} cm
   * @param {String} data
   * @returns {{} | null}
   * @private
   */
  this._keyData = function (cm, data) {
    var result = {};
    if (typeof data === 'object' && data) {
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
