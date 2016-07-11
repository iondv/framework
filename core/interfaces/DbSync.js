/**
 * Created by Vasiliy Ermilov (email: inkz@xakep.ru, telegram: @inkz1) on 26.04.16.
 */
'use strict';

/**
 * @constructor
 */
function DbSync() {

  /**
   * @param {{}} classMeta
   * @param {String} namespace
   * @returns {Promise}
     */
  this.defineClass = function (classMeta, namespace) {
    return this._defineClass(classMeta, namespace);
  };

  /**
   *
   * @param {String} classMetaName
   * @param {String} version
   * @returns {Promise}
     */
  this.undefineClass = function (classMetaName,version, namespace) {
    return this._undefineClass(classMetaName, version, namespace);
  };

  /**
   *
   * @param {{}} viewMeta
   * @param {String} className
   * @param {String} type
   * @param {String} path
   * @returns {Promise}
     */
  this.defineView = function (viewMeta, className, type, path, namespace) {
    return this._defineView(viewMeta, className, type, path, namespace);
  };

  /**
   * @param {String} className
   * @param {String} type
   * @param {String} path
   * @param {String} version
   * @returns {Promise}
     */
  this.undefineView = function (className, type, path, version, namespace) {
    return this._undefineView(className, type, path, version, namespace);
  };

  /**
   *
   * @param {{}} navSection
   * @returns {Promise}
     */
  this.defineNavSection = function (navSection, namespace) {
    return this._defineNavSection(navSection, namespace);
  };

  /**
   *
   * @param {String} sectionName
   * @returns {Promise}
     */
  this.undefineNavSection = function (sectionName, namespace) {
    return this._undefineNavSection(sectionName, namespace);
  };

  /**
   * @param {{}} navNode
   * @param {String} navSectionName
   * @returns {Promise}
   */
  this.defineNavNode = function (navNode, navSectionName, namespace) {
    return this._defineNavNode(navNode, navSectionName, namespace);
  };

  /**
   * @param {String} path
   * @returns {Promise}
     */
  this.undefineNavNode = function (path, namespace) {
    return this._undefineNavNode(path, namespace);
  };
}

module.exports = DbSync;
