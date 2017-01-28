/**
 * Created by Vasiliy Ermilov (email: inkz@xakep.ru, telegram: @inkz1) on 28.04.16.
 */
'use strict';
/**
 *
 * @constructor
 */
function DataRepository() {

  /**
   * @param {String} className
   * @param {{}} data
   * @param {String} [version]
   * @param {{autoassign: Boolean}} [options]
   * @returns {Item}
   */
  this.wrap = function (className, data, version, options) {
    return this._wrap(className, data, version, options || {});
  };

  /**
   *
   * @param {Object[]} validators
   * @returns {Promise}
   */
  this.setValidators = function (validators) {
    return this._setValidators(validators);
  };

  /**
   * @param {String | Item} obj
   * @param {{filter: Object}} [options]
   * @returns {Promise}
   */
  this.getCount  = function (obj, options) {
    return this._getCount(obj, options || {});
  };

  /**
   * @param {String | Item} obj
   * @param {{}} [options]
   * @param {{}} [options.filter]
   * @param {Number} [options.offset]
   * @param {Number} [options.count]
   * @param {{}} [options.sort]
   * @param {Boolean} [options.countTotal]
   * @param {Number} [options.nestingDepth]
   * @returns {Promise}
   */
  this.getList = function (obj, options) {
    return this._getList(obj, options || {});
  };

  /**
   * @param {String} className
   * @param {{}} [options]
   * @param {{}} [options.expressions]
   * @param {{}} [options.filter]
   * @param {{}} [options.groupBy]
   * @returns {Promise}
   */
  this.aggregate = function (className, options) {
    return this._aggregate(className, options || {});
  };

  /**
   * @param {String | Item} obj
   * @param {String} [id]
   * @param {{}} [options]
   * @param {Number} [options.nestingDepth]
   * @returns {Promise}
   */
  this.getItem = function (obj, id, options) {
    return this._getItem(obj, id, options || {});
  };

  /**
   * @param {String} className
   * @param {{}} data
   * @param {String} [version]
   * @param {ChangeLogger} [changeLogger]
   * @param {{}} [options]
   * @param {Number} [options.nestingDepth]
   * @param {Boolean} [options.skipResult]
   * @returns {Promise}
   */
  this.createItem = function (className, data, version, changeLogger, options) {
    return this._createItem(className, data, version, changeLogger, options || {});
  };

  /**
   * @param {String} className
   * @param {String} id
   * @param {{}} data
   * @param {ChangeLogger} [changeLogger]
   * @param {{}} [options]
   * @param {Number} [options.nestingDepth]
   * @param {Boolean} [options.skipResult]
   * @returns {Promise}
   */
  this.editItem = function (className, id, data, changeLogger, options) {
    return this._editItem(className, id, data, changeLogger, options || {});
  };

  /**
   * @param {String} className
   * @param {String} id
   * @param {{}} data
   * @param {String} [version]
   * @param {ChangeLogger} [changeLogger]
   * @param {{}} [options]
   * @param {Number} [options.nestingDepth]
   * @param {Boolean} [options.autoAssign]
   * @param {Boolean} [options.skipResult]
   * @returns {Promise}
   */
  this.saveItem = function (className, id, data, version, changeLogger, options) {
    return this._saveItem(className, id, data, version, changeLogger, options || {});
  };

  /**
   * @param {String} className
   * @param {String} id
   * @param {ChangeLogger} [changeLogger]
   * @param {{}} [options]
   * @returns {Promise}
   */
  this.deleteItem = function (className, id, changeLogger, options) {
    return this._deleteItem(className, id, changeLogger, options || {});
  };

  /**
   * @param {Item} master
   * @param {String} collection
   * @param {Item[]} details
   * @param {ChangeLogger} [changeLogger]
   * @param {{}} [options]
   * @returns {Promise}
   */
  this.put = function (master, collection, details, changeLogger, options) {
    return this._put(master, collection, details, changeLogger, options || {});
  };

  /**
   * @param {Item} master
   * @param {String} collection
   * @param {Item[]} details
   * @param {ChangeLogger} [changeLogger]
   * @param {{}} [options]
   * @returns {Promise}
   */
  this.eject = function (master, collection, details, changeLogger, options) {
    return this._eject(master, collection, details, changeLogger, options || {});
  };

  /**
   * @param {Item} master
   * @param {String} collection
   * @param {{}} [options]
   * @param {{}} [options.filter]
   * @param {Number} [options.offset]
   * @param {Number} [options.count]
   * @param {{}} [options.sort]
   * @param {Boolean} [options.countTotal]
   * @param {Number} [options.nestingDepth]
   * @returns {Promise}
   */
  this.getAssociationsList = function (master, collection, options) {
    return this._getAssociationsList(master, collection, options || {});
  };

  /**
   * @param {Item} master
   * @param {String} collection
   * @param {{}} [options]
   * @param {{}} [options.filter]
   * @param {Number} [options.offset]
   * @param {Number} [options.count]
   * @param {{}} [options.sort]
   * @param {Boolean} [options.countTotal]
   * @param {Number} [options.nestingDepth]
   * @returns {Promise}
   */
  this.getAssociationsCount = function (master, collection, options) {
    return this._getAssociationsCount(master, collection, options || {});
  };
}

module.exports = DataRepository;
