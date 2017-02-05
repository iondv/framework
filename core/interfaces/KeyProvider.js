/**
 * Created by kras on 05.05.16.
 */
'use strict';

function KeyProvider() {
  /**
   * @param {ClassMeta} cm
   * @param {{}} data
   * @returns {String}
   */
  this.formKey = function (cm, data) {
    return this._formKey(cm, data);
  };

  /**
   * @param {ClassMeta} cm
   * @param {String} id
   * @returns {{}}
   */
  this.keyToData = function (cm, id) {
    return this._keyToData(cm, id);
  };

  /**
   * @param {ClassMeta} cm
   * @param {{}} data
   * @returns {{} | null}
   */
  this.keyData = function (cm, data) {
    return this._keyData(cm, data);
  };

  this.filterByItemId = function() {
    
  };

}

module.exports = KeyProvider;
