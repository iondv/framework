// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
/**
 * Created by Vasiliy Ermilov (email: inkz@xakep.ru, telegram: @inkz1) on 29.04.16.
 */
'use strict';

var PropertyTypes = require('core/PropertyTypes');
var equal = require('core/equal');

/**
 * @param {Item} item
 * @param {Object} propertyMeta
 * @constructor
 */
function Property(item, propertyMeta) {

  /**
   * @type {Item}
   */
  this.item = item;

  /**
   * @type {Object}
   */
  this.meta = propertyMeta;

  this.selectList = null;

  this.getName = function () {
    return this.meta.name;
  };

  this.getType = function () {
    return this.meta.type;
  };

  this.getCaption = function () {
    return this.meta.caption;
  };

  this.isReadOnly = function () {
    return this.meta.readonly;
  };

  this.isIndexed = function () {
    return this.meta.indexed;
  };

  this.isUnique = function () {
    return this.meta.unique;
  };

  this.isNullable = function () {
    return this.meta.nullable;
  };

  this.eagerLoading = function () {
    return this.meta.eagerLoading;
  };

  this.hint = function () {
    return this.meta.hint;
  };

  this.getValue = function () {
    return this.item.get(this.getName());
  };

  this.selectionKeyMatch = function (key) {
    return equal(this.getValue(), key);
  };

  this.getDisplayValue = function () {
    var v = this.getValue();
    if (this.meta.selectionProvider) {
      var selection = this.getSelection();
      for (var i = 0; i < selection.length; i++) { // TODO Оптимизировать (искать по хешу?)
        if (this.selectionKeyMatch(selection[i].key)) {
          return selection[i].value;
        }
      }
    }

    if (this.getType() === PropertyTypes.REFERENCE) {
      var agr = this.item.getAggregate(this.getName());
      if (agr) {
        return agr.toString();
      } else {
        return '';
      }
    }

    return v !== null ? v : '';
  };

  this.evaluate = function () {
    if (this.getType() === PropertyTypes.REFERENCE) {
      return this.item.getAggregate(this.getName());
    } else if (this.getType() === PropertyTypes.COLLECTION) {
      return this.item.getAggregates(this.getName());
    } else {
      return this.getValue();
    }
  };

  this.getSelection = function () {
    if (this.selectList) {
      return this.selectList;
    }
    if (this.meta.selectionProvider) {
      this.selectList = this.meta.selectionProvider.getSelection(this.item);
      return this.selectList;
    }
    return null;
  };

  this.setValue = function (value) {
    this.item.set(this.getName(), value);
    this.selectList = null;
  };

}

module.exports = Property;
