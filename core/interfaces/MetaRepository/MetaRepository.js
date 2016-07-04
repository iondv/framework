/**
 * Created by Vasiliy Ermilov (email: inkz@xakep.ru, telegram: @inkz1) on 08.04.16.
 */
'use strict';

/**
 * @constructor
 */
function MetaRepository() {

  // MetaRepository

  /**
   *
   * @param {String} name
   * @param {String} [version]
   * @returns {ClassMeta}
   */
  this.getMeta = function (name,version) {
    return this._getMeta(name, version);
  };

  /**
   *
   * @param {String} ancestor
   * @param {String} [version]
   * @param {Boolean} [direct]
   * @returns {ClassMeta[]}
   */
  this.listMeta = function (ancestor,version,direct) {
    return this._listMeta(ancestor, version, direct);
  };

  /**
   * @param {String} classname
   * @param {String} [version]
   * @returns {ClassMeta}
   */
  this.ancestor = function (classname, version) {
    return this._ancestor(classname, version);
  };

  /**
   * @param {String} classname
   * @param {String} [version]
   * @returns {Object[]}
   */
  this.propertyMetas = function (classname, version) {
    return this._propertyMetas(classname, version);
  };

  // NavigationRepository

  /**
   * @returns {Object[]}
   */
  this.getNavigationSections = function () {
    return this._getNavigationSections();
  };

  /**
   * @param {String} code
   * @returns {Object | null}
   */
  this.getNavigationSection = function (code) {
    return this._getNavigationSection(code);
  };

  /**
   * @param {String} code
   * @returns {Object | null}
   */
  this.getNode = function (code) {
    return this._getNode(code);
  };

  /**
   * @param {String} sections
   * @returns {Object[]}
   */
  this.getNodes = function (sections, parent) {
    return this._getNodes(sections, parent);
  };

  /**
   * @param {String} className
   * @returns {Object | null}
   */
  this.getNodeForClassname = function (className) {
    return this._getNodeForClassname(className);
  };

  // ViewModelRepository

  /**
   * @param {String} className
   * @param {String} node
   * @returns {Object | null}
   */
  this.getListViewModel = function (className, node) {
    return this._getListViewModel(className, node);
  };

  /**
   * @param {String} className
   * @param {String} collection
   * @param {String} node
   * @returns {Object | null}
   */
  this.getCollectionViewModel = function (className, collection, node) {
    return this._getCollectionViewModel(className, collection, node);
  };

  /**
   * @param {String} className
   * @param {String} node
   * @returns {Object | null}
   */
  this.getItemViewModel = function (className, node) {
    return this._getItemViewModel(className, node);
  };

  /**
   * @param {String} className
   * @param {String} node
   * @returns {Object | null}
   */
  this.getCreationViewModel = function (className, node) {
    return this._getCreationViewModel(className, node);
  };

  /**
   * @param {String} className
   * @param {String} node
   * @returns {Object | null}
   */
  this.getDetailViewModel = function (className, node) {
    return this._getDetailViewModel(className, node);
  };

  /**
   * @param {String} name
   * @returns {Object | null}
   */
  this.getMask = function (name) {
    return this._getMask(name);
  };

  /**
   * @returns {Object[]}
   */
  this.getValidators = function () {
    return this._getValidators();
  };

  /**
   * @returns {Promise}
   */
  this.init = function () {
    return this._init();
  };
}

module.exports = MetaRepository;
