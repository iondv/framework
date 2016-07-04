/**
 * Created by Vasiliy Ermilov (email: inkz@xakep.ru, telegram: @inkz1) on 26.04.16.
 */
'use strict';

/**
 * @constructor
 */
function DbSync() {

  /**
   *
   * @param {{}} classMeta
   * @returns {Promise}
     */
  this.defineClass = function (classMeta) {
    return this._defineClass(classMeta);
  };

  /**
   *
   * @param {String} classMetaName
   * @param {String} version
   * @returns {Promise}
     */
  this.undefineClass = function (classMetaName,version) {
    return this._undefineClass(classMetaName, version);
  };

  /**
   *
   * @param {{}} viewMeta
   * @param {String} className
   * @param {String} type
   * @param {String} path
   * @returns {Promise}
     */
  this.defineView = function (viewMeta, className, type, path) {
    return this._defineView(viewMeta, className, type, path);
  };

  /**
   * @param {String} className
   * @param {String} type
   * @param {String} path
   * @param {String} version
   * @returns {Promise}
     */
  this.undefineView = function (className, type, path, version) {
    return this._undefineView(className, type, path, version);
  };

  /**
   *
   * @param {{}} navSection
   * @returns {Promise}
     */
  this.defineNavSection = function (navSection) {
    return this._defineNavSection(navSection);
  };

  /**
   *
   * @param {String} sectionName
   * @returns {Promise}
     */
  this.undefineNavSection = function (sectionName) {
    return this._undefineNavSection(sectionName);
  };

  /**
   * @param {{}} navNode
   * @param {String} navSectionName
   * @returns {Promise}
   */
  this.defineNavNode = function (navNode,navSectionName) {
    return this._defineNavNode(navNode, navSectionName);
  };

  /**
   * @param {String} path
   * @returns {Promise}
     */
  this.undefineNavNode = function (path) {
    return this._undefineNavNode(path);
  };
}

module.exports = DbSync;
