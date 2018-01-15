/**
 * Created by Vasiliy Ermilov (email: inkz@xakep.ru, telegram: @inkz1) on 29.04.16.
 */
'use strict';

const Property = require('./Property');
const PropertyTypes = require('core/PropertyTypes');

// jshint maxstatements: 30

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

  this.collections = {};

  this.calculated = {};

  this.files = {};

  this.slCacheClean = true;

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
   * @returns {String}
   */
  this.getCreator = function () {
    return this.base._creator;
  };

  /**
   * @returns {String}
   */
  this.getEditor = function () {
    return this.base._editor;
  };

  /**
   * @param {String} name
   * @returns {Item | null}
   */
  this.getAggregate = function (name) {
    let props = this.getProperties();
    let p = props[name];
    if (p && p.getType() === PropertyTypes.REFERENCE) {
      return this.references[name] || null;
    }
    return null;
  };

  /**
   * @param {String} name
   * @returns {Array | null}
   */
  this.getAggregates = function (name) {
    let props = this.getProperties();
    let p = props[name];
    if (p && p.getType() === PropertyTypes.COLLECTION && this.collections) {
      return this.collections[name] || null;
    }
    return null;
  };

  function getFromBase(name) {
    if (_this.calculated.hasOwnProperty(name)) {
      return _this.calculated[name];
    }

    if (_this.base.hasOwnProperty(name)) {
      let props = _this.getProperties();
      let p = props[name];
      if (p && (
        p.getType() === PropertyTypes.FILE ||
        p.getType() === PropertyTypes.IMAGE ||
        p.getType() === PropertyTypes.FILE_LIST
        )
      ) {
        if (_this.files.hasOwnProperty(name)) {
          return _this.files[name];
        }
      }
      return _this.base[name];
    }
    return null;
  }

  function setToBase(name,value) {
    let p = _this.property(name);
    if (p) {
      if (value instanceof Item) {
        _this.references[name] = value;
        _this.base[name] = value.getItemId();
      } else {
        _this.base[name] = value;
      }
      if (_this.properties && !_this.slCacheClean) {
        for (let nm in _this.properties) {
          if (_this.properties.hasOwnProperty(nm)) {
            _this.properties[nm].selectList = null;
          }
        }
        _this.slCacheClean = true;
      }
    }
  }

  this.get = function (name) {
    if (name === '__class') {
      return this.getClassName();
    }

    if (name === '__classTitle') {
      return this.getMetaClass().getCaption();
    }

    var dot = name.indexOf('.');
    if (dot > -1) {
      let pn = name.substring(0, dot);
      let props = this.getProperties();
      if (props.hasOwnProperty(pn)) {
        if (props[pn].getType() === PropertyTypes.REFERENCE) {
          let i = this.getAggregate(pn);
          if (i) {
            return i.get(name.substring(dot + 1));
          }
        } else if (props[pn].getType() === PropertyTypes.COLLECTION) {
          let is = this.getAggregates(pn);
          if (Array.isArray(is)) {
            let result = [];
            for (let i = 0; i < is.length; i++) {
              result.push(is[i].get(name.substring(dot + 1)));
            }
            return result;
          }
        }
      }
      return null;
    }
    return getFromBase(name);
  };

  this.set = function (name, value) {
    let dot = name.indexOf('.');
    if (dot > -1) {
      let i = this.getAggregate(name.substring(0, dot));
      if (i) {
        i.set(name.substring(dot + 1), value);
      }
    } else {
      setToBase(name, value);
    }
  };

  /**
   * @param {String} nm
   * @param {ClassMeta} cm
   */
  function findPropertyMeta(nm, cm) {
    let dot;
    if ((dot = nm.indexOf('.')) > -1) {
      let pm = cm.getPropertyMeta(nm.substring(0, dot));
      if (!pm) {
        throw new Error('Не найден атрибут ' + nm + ' класса ' + cm.getCanonicalName());
      }
      if (pm.type === PropertyTypes.REFERENCE || pm.type === PropertyTypes.COLLECTION) {
        return findPropertyMeta(nm.substring(dot + 1), pm._refClass);
      } else {
        return null;
      }
    }
    return cm.getPropertyMeta(nm);
  }

  /**
   * @param {String} name
   * @returns {Property | null}
   */
  this.property = function (name) {
    let props = this.getProperties();
    if (props.hasOwnProperty(name)) {
      return props[name];
    } else {
      let pm = findPropertyMeta(name, this.classMeta);
      if (pm) {
        return new Property(this, pm, name);
      }
    }
    return null;
  };

  function initClassProps(cm) {
    if (cm.getAncestor()) {
      initClassProps(cm.getAncestor());
    }
    let pm = cm.getPropertyMetas();
    for (let i = 0; i < pm.length; i++) {
      if (pm[i].type !== PropertyTypes.STRUCT) {
        _this.properties[pm[i].name] = new Property(_this, pm[i]);
      }
    }
  }

  /**
   * @returns {Property{}}
   */
  this.getProperties = function () {
    if (this.properties === null) {
      this.properties = {};
      initClassProps(this.classMeta);
    }
    return this.properties;
  };
}

Item.prototype.toString = function (semanticGetter, dateCallback, circular) {
  circular = typeof circular !== 'undefined' && circular !== null ? circular : {};
  if (circular[this.getClassName() + '@' + this.getItemId()]) {
    return '';
  }
  circular[this.getClassName() + '@' + this.getItemId()] = true;
  if (typeof semanticGetter === 'function') {
    return semanticGetter.call(this, dateCallback, circular);
  }
  if (this.classMeta.isSemanticCached()) {
    return this.base.__semantic;
  }
  return this.classMeta.getSemantics(this, dateCallback, circular);
};

module.exports = Item;
