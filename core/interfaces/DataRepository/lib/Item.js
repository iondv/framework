/**
 * Created by Vasiliy Ermilov (email: inkz@xakep.ru, telegram: @inkz1) on 29.04.16.
 */
'use strict';

var Property = require('./Property');
var PropertyTypes = require('core/PropertyTypes');

/**
 * @param {String} id
 * @param {{}} base
 * @param {ClassMeta} classMeta
 * @constructor
 */
function Item(id, base, classMeta) {

  var _this = this;

  /**
   * @type {String}
   */
  this.id = id;

  /**
   * @type {Object}
   */
  this.base = base;

  /**
   * @type {ClassMeta}
   */
  this.classMeta = classMeta;

  this.properties = null;

  this.references = {};

  this.files = {};

  this.getItemId = function () {
    return this.id;
  };

  this.getClassName = function () {
    return this.classMeta.getCanonicalName();
  };

  /**
   * @returns {ClassMeta}
   */
  this.getMetaClass = function () {
    return this.classMeta;
  };

  /**
   * @param {String} name
   * @returns {Item | null}
   */
  this.getAggregate = function (name) {
    var props = this.getProperties();
    var p = props[name];
    if (p && p.getType() === PropertyTypes.REFERENCE) {
      return this.references[name];
    }
    return null;
  };

  /**
   * @param {String} name
   * @returns {Array}
   */
  this.getAggregates = function (name) {
    var props = this.getProperties();
    var p = props[name];
    if (p && p.getType() === PropertyTypes.COLLECTION && this.collections) {
      return this.collections[name];
    }
    return [];
  };

  function getFromBase(name) {
    if (_this.base.hasOwnProperty(name)) {
      var props = _this.getProperties();
      var p = props[name];
      if (p && (p.getType() === PropertyTypes.FILE || p.getType === PropertyTypes.IMAGE)) {
        if (_this.files.hasOwnProperty(name)) {
          return _this.files[name];
        }
      }
      return _this.base[name];
    }
    return null;
  }

  function setToBase(name,value) {
    var p = _this.property(name);
    if (p) {
      _this.base[name] = value;
    }
  }

  this.get = function (name) {
    var dot = name.indexOf('.');
    if (dot > -1) {
      var i = this.getAggregate(name.substring(0, dot));
      if (i) {
        return i.get(name.substring(dot + 1));
      }
    }
    return getFromBase(name);
  };

  this.set = function (name, value) {
    var dot = name.indexOf('.');
    if (dot > -1) {
      var i = this.getAggregate(name.substring(0, dot));
      if (i) {
        i.set(name.substring(dot + 1), value);
      }
    } else {
      setToBase(name, value);
    }
  };

  /**
   * @param {String} name
   * @returns {Property | null}
   */
  this.property = function (name) {
    var dot = name.indexOf('.');
    if (dot > -1) {
      var i = this.getAggregate(name.substring(0, dot));
      if (i) {
        return i.property(name.substring(dot + 1));
      }
    }
    var props = this.getProperties();
    if (props.hasOwnProperty(name)) {
      return props[name];
    }
    return null;
  };

  function initClassProps(cm) {
    var pm = cm.getPropertyMetas();
    for (var i = 0; i < pm.length; i++) {
      if (pm[i].type !== PropertyTypes.STRUCT) {
        _this.properties[pm[i].name] = new Property(_this, pm[i]);
      }
    }
    if (cm.getAncestor()) {
      initClassProps(cm.getAncestor());
    }
  }

  /**
   * @returns {Property[]}
   */
  this.getProperties = function () {
    if (this.properties === null) {
      this.properties = {};
      initClassProps(this.classMeta);
    }
    return this.properties;
  };
}

Item.prototype.toString = function () {
  var semantic = this.classMeta.getSemantic();
  if (typeof semantic === 'function') {
    return semantic.call(this);
  } else {
    return this.classMeta.getCaption() + '@' + this.getItemId();
  }
};

module.exports = Item;
