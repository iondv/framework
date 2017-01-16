/**
 * Created by kras on 05.05.16.
 */
'use strict';

function KeyProvider() {
  /**
   * @param {String} classname
   * @param {{}} data
   * @param {String} [namespace]
   * @returns {String}
   */
  this.formKey = function (classname, data, namespace) {
    return this._formKey(classname, data, namespace);
  };

  /**
   * @param {String} classname
   * @param {String} id
   * @param {String} [namespace]
   * @returns {{}}
   */
  this.keyToData = function (classname, id, namespace) {
    return this._keyToData(classname, id, namespace);
  };

  /**
   * @param {String} classname
   * @param {{}} data
   * @param {String} [namespace]
   * @returns {{} | null}
   */
  this.keyData = function (classname, data, namespace) {
    return this._keyData(classname, data, namespace);
  };
}

module.exports = KeyProvider;
