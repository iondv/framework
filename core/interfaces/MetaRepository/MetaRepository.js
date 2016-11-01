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
   * @param {String} [namespace]
   * @returns {ClassMeta}
   */
  this.getMeta = function (name, version, namespace) {
    return this._getMeta(name, version, namespace);
  };

  /**
   *
   * @param {String} ancestor
   * @param {String} [version]
   * @param {Boolean} [direct]
   * @param {String} [namespace]
   * @returns {ClassMeta[]}
   */
  this.listMeta = function (ancestor, version, direct, namespace) {
    return this._listMeta(ancestor, version, direct, namespace);
  };

  /**
   * @param {String} classname
   * @param {String} [version]
   * @param {String} [namespace]
   * @returns {ClassMeta}
   */
  this.ancestor = function (classname, version, namespace) {
    return this._ancestor(classname, version, namespace);
  };

  /**
   * @param {String} classname
   * @param {String} [version]
   * @param {String} [namespace]
   * @returns {Object[]}
   */
  this.propertyMetas = function (classname, version, namespace) {
    return this._propertyMetas(classname, version, namespace);
  };

  // NavigationRepository

  /**
   * @param {String} [namespace]
   * @returns {Object[]}
   */
  this.getNavigationSections = function (namespace) {
    return this._getNavigationSections(namespace);
  };

  /**
   * @param {String} code
   * @param {String} [namespace]
   * @returns {Object | null}
   */
  this.getNavigationSection = function (code, namespace) {
    return this._getNavigationSection(code, namespace);
  };

  /**
   * @param {String} code
   * @param {String} [namespace]
   * @returns {Object | null}
   */
  this.getNode = function (code, namespace) {
    return this._getNode(code, namespace);
  };

  /**
   * @param {String} sections
   * @param {String} [parent]
   * @param {String} [namespace]
   * @returns {Object[]}
   */
  this.getNodes = function (sections, parent, namespace) {
    return this._getNodes(sections, parent, namespace);
  };

  /**
   * @param {String} className
   * @param {String} [namespace]
   * @returns {Object | null}
   */
  this.getNodeForClassname = function (className, namespace) {
    return this._getNodeForClassname(className, namespace);
  };

  // ViewModelRepository

  /**
   * @param {String} className
   * @param {String} node
   * @param {String} [namespace]
   * @param {String} [version]
   * @returns {Object | null}
   */
  this.getListViewModel = function (className, node, namespace, version) {
    return this._getListViewModel(className, node, namespace, version);
  };

  /**
   * @param {String} className
   * @param {String} collection
   * @param {String} node
   * @param {String} [namespace]
   * @param {String} [version]
   * @returns {Object | null}
   */
  this.getCollectionViewModel = function (className, collection, node, namespace, version) {
    return this._getCollectionViewModel(className, collection, node, namespace, version);
  };

  /**
   * @param {String} className
   * @param {String} node
   * @param {String} [namespace]
   * @param {String} [version]
   * @returns {Object | null}
   */
  this.getItemViewModel = function (className, node, namespace, version) {
    return this._getItemViewModel(className, node, namespace, version);
  };

  /**
   * @param {String} className
   * @param {String} node
   * @param {String} [namespace]
   * @param {String} [version]
   * @returns {Object | null}
   */
  this.getCreationViewModel = function (className, node, namespace, version) {
    return this._getCreationViewModel(className, node, namespace, version);
  };

  /**
   * @param {String} className
   * @param {String} node
   * @param {String} [namespace]
   * @param {String} [version]
   * @returns {Object | null}
   */
  this.getDetailViewModel = function (className, node, namespace, version) {
    return this._getDetailViewModel(className, node, namespace, version);
  };

  /**
   * @param {String} className
   * @param {String} [namespace]
   * @param {String} [version]
   * @returns {Object[] | null}
   */
  this.getWorkflows = function (className, namespace, version) {
    return this._getWorkflows(className, namespace, version);
  };

  /**
   * @param {String} className
   * @param {String} name
   * @param {String} [namespace]
   * @param {String} [version]
   * @returns {Object[] | null}
   */
  this.getWorkflow = function (className, name, namespace, version) {
    return this._getWorkflow(className, name, namespace, version);
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
   * @param {DbSync} sync
   * @returns {Promise}
   */
  this.init = function (sync) {
    return this._init(sync);
  };
}

module.exports = MetaRepository;
