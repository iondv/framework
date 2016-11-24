/**
 * Created by Vasiliy Ermilov (email: inkz@xakep.ru, telegram: @inkz1) on 26.04.16.
 */
'use strict';

/**
 * @constructor
 */
function DbSync() {

  /**
   * @returns {Promise}
   */
  this.init = function () {
    return this._init();
  };

  /**
   * @param {{}} classMeta
   * @param {String} [namespace]
   * @returns {Promise}
   */
  this.defineClass = function (classMeta, namespace) {
    return this._defineClass(classMeta, namespace);
  };

  /**
   *
   * @param {String} classMetaName
   * @param {String} version
   * @param {String} [namespace]
   * @returns {Promise}
   */
  this.undefineClass = function (classMetaName, version, namespace) {
    return this._undefineClass(classMetaName, version, namespace);
  };

  /**
   *
   * @param {{}} viewMeta
   * @param {String} className
   * @param {String} type
   * @param {String} path
   * @param {String} [namespace]
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
   * @param {String} [namespace]
   * @returns {Promise}
   */
  this.undefineView = function (className, type, path, version, namespace) {
    return this._undefineView(className, type, path, version, namespace);
  };

  /**
   *
   * @param {{}} navSection
   * @param {String} [namespace]
   * @returns {Promise}
   */
  this.defineNavSection = function (navSection, namespace) {
    return this._defineNavSection(navSection, namespace);
  };

  /**
   *
   * @param {String} sectionName
   * @param {String} [namespace]
   * @returns {Promise}
   */
  this.undefineNavSection = function (sectionName, namespace) {
    return this._undefineNavSection(sectionName, namespace);
  };

  /**
   * @param {{}} navNode
   * @param {String} navSectionName
   * @param {String} [namespace]
   * @returns {Promise}
   */
  this.defineNavNode = function (navNode, navSectionName, namespace) {
    return this._defineNavNode(navNode, navSectionName, namespace);
  };

  /**
   * @param {String} path
   * @param {String} [namespace]
   * @returns {Promise}
   */
  this.undefineNavNode = function (path, namespace) {
    return this._undefineNavNode(path, namespace);
  };

  /**
   * @param {String} wfMeta
   * @param {String} [namespace]
   * @returns {Promise}
   */
  this.defineWorkflow = function (wfMeta, namespace) {
    return this._defineWorkflow(wfMeta, namespace);
  };

  /**
   * @param {String} className
   * @param {String} name
   * @param {String} [namespace]
   * @param {String} [version]
   * @returns {Promise}
   */
  this.undefineWorkflow = function (className, name, namespace, version) {
    return this._undefineWorkflow(className, name, namespace, version);
  };

  this.defineUserType = function (userType) {
    return this._defineUserType(userType);
  };
}

module.exports = DbSync;
