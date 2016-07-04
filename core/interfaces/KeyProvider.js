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
  this.formKey = function (classname, data) {
    return this._formKey(classname, data);
  };

  /**
   * @param {String} classname
   * @param {String} id
   * @returns {{}}
   */
  this.keyToData = function (classname, id) {
    return this._keyToData(classname, id);
  };

  /**
   * @param {String} classname
   * @param {{}} data
   * @returns {{}}
   */
  this.keyData = function (classname, data) {
    return this._keyData(classname, data);
  };
}

module.exports = KeyProvider;
