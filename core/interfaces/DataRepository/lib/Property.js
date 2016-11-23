// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
/**
 * Created by Vasiliy Ermilov (email: inkz@xakep.ru, telegram: @inkz1) on 29.04.16.
 */
'use strict';

const PropertyTypes = require('core/PropertyTypes');
const equal = require('core/equal');

// jshint maxstatements: 30, maxcomplexity: 20

/**
 * @param {Item} item
 * @param {Object} propertyMeta
 * @param {String} [name]
 * @constructor
 */
function Property(item, propertyMeta, name) {

  this.name = name;
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
    return this.name || this.meta.name;
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
    if (this.getType() === PropertyTypes.REFERENCE && this.meta.backRef) {
      var agr = this.item.getAggregate(this.getName());
      if (agr) {
        return agr.getItemId();
      }
    }
    return this.item.get(this.getName());
  };

  this.selectionKeyMatch = function (key) {
    return equal(this.getValue(), key);
  };

  this.getDisplayValue = function (dateCallback) {
    var i;
    if (this.getType() === PropertyTypes.COLLECTION) {
      var result = '';
      var agregates = this.item.getAggregates(this.getName());
      if (Array.isArray(aggregates)) {
        for (i = 0; i < agregates.length; i++) {
          agregates[i].toString();
          if (typeof this.meta.semanticGetter === 'function') {
            result = result + (result ? ' ' : '') +
              this.meta.semanticGetter.call(agregates[i], dateCallback);
          } else {
            result = result + (result ? ' ' : '') + agregates[i].toString(null, dateCallback);
          }
        }
      }
      return result;
    }

    var v = this.getValue();
    if (this.meta.selectionProvider) {
      var selection = this.getSelection();
      for (i = 0; i < selection.length; i++) { // TODO Оптимизировать (искать по хешу?)
        if (this.selectionKeyMatch(selection[i].key)) {
          return selection[i].value;
        }
      }
    }

    if (this.getType() === PropertyTypes.REFERENCE) {
      var agr = this.item.getAggregate(this.getName());
      if (agr) {
        if (typeof this.meta.semanticGetter === 'function') {
          return this.meta.semanticGetter.call(agr, dateCallback);
        }
        return agr.toString(null, dateCallback);
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
