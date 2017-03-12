// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
/**
 * Created by Vasiliy Ermilov (email: inkz@xakep.ru, telegram: @inkz1) on 29.04.16.
 */
'use strict';

const PropertyTypes = require('core/PropertyTypes');
const equal = require('core/equal');
const scheduleToString = require('core/util/schedule').scheduleToString;

// jshint maxstatements: 30, maxcomplexity: 20

/**
 * @param {Item} item
 * @param {Object} propertyMeta
 * @param {String} [name]
 * @constructor
 */
function Property(item, propertyMeta, name) {
  var _this = this;

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
      var agr = this.evaluate();
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
    if (this.getType() === PropertyTypes.COLLECTION) {
      let result = '';
      let agregates = this.evaluate();
      if (Array.isArray(agregates)) {
        for (let i = 0; i < agregates.length; i++) {
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

    if (this.getType() === PropertyTypes.DATETIME && v instanceof Date) {
      v = typeof dateCallback === 'function' ? dateCallback.call(null, v) : v.toDateString();
    }

    if (this.meta.selectionProvider) {
      var selection = this.getSelection();
      if (Array.isArray(selection)) {
        for (let i = 0; i < selection.length; i++) { // TODO Оптимизировать (искать по хешу?)
          if (this.selectionKeyMatch(selection[i].key)) {
            return selection[i].value;
          }
        }
      }
    }

    if (this.getType() === PropertyTypes.REFERENCE) {
      let agr = this.evaluate();
      if (agr) {
        if (typeof this.meta.semanticGetter === 'function') {
          return this.meta.semanticGetter.call(agr, dateCallback);
        }
        return agr.toString(null, dateCallback);
      } else {
        return '';
      }
    }

    if (this.getType() === PropertyTypes.SCHEDULE && v) {
      return scheduleToString(v);
    }
    return v !== null ? v : '';
  };

  function evalProperty(item, prop) {
    var pos;
    if ((pos = prop.getName().indexOf('.')) > 0) {
      let p = item.property(prop.getName().substring(0, pos));
      if (p.getType() === PropertyTypes.REFERENCE) {
        let ri = p.evaluate();
        if (ri) {
          p = ri.property(prop.getName().substr(pos + 1));
          if (p) {
            return evalProperty(ri, p);
          }
        }
      } else if (p.getType() === PropertyTypes.COLLECTION) {
        let ris = p.evaluate();
        if (Array.isArray(ris)) {
          let result = [];
          for (let i = 0; i < ris.length; i++) {
            p = ris[i].property(prop.getName().substr(pos + 1));
            if (p) {
              let v = evalProperty(ris[i], p);
              if (Array.isArray(v)) {
                Array.prototype.push.apply(result, v);
              } else {
                result.push(v);
              }
            }
          }
          return result;
        }
      }
      return null;
    }

    if (prop.getType() === PropertyTypes.REFERENCE) {
      return item.getAggregate(prop.getName());
    } else if (prop.getType() === PropertyTypes.COLLECTION) {
      return item.getAggregates(prop.getName());
    } else {
      return prop.getValue();
    }
  }

  this.evaluate = function () {
    return evalProperty(this.item, this);
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
