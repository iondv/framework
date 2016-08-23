/**
 * Created by kras on 05.05.16.
 */
'use strict';

function KeyProvider() {
  /**
   * @param {String} classname
   * @param {{}} data
   * @returns {String}
   */
  this.formKey = function (classname, data, namespace) {
    return this._formKey(classname, data, namespace);
  };

  /**
   * @param {String} classname
   * @param {String} id
   * @returns {{}}
   */
  this.keyToData = function (classname, id, namespace) {
    return this._keyToData(classname, id, namespace);
  };

  /**
   * @param {String} classname
   * @param {{}} data
   * @returns {{}}
   */
  this.keyData = function (classname, data, namespace) {
    return this._keyData(classname, data, namespace);
  };
}

module.exports = KeyProvider;
