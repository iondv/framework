/**
 * Created by Vasiliy Ermilov (email: inkz@xakep.ru, telegram: @inkz1) on 29.04.16.
 */
'use strict';

const Property = require('./Property');
const PropertyTypes = require('core/PropertyTypes');
const cast = require('core/cast');

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

  this.stringValue = false;

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

  this.emptify = function () {
    this.id = null;

    this.base = {};

    this.references = {};

    this.collections = {};

    this.calculated = {};

    this.files = {};

    this.slCacheClean = true;
  };

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
        if (p.getType() === PropertyTypes.REFERENCE) {
          delete _this.references[name];
        }
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

  /**
   * @param {{}} [needed]
   * @param {Boolean} [cached]
   * @returns {Promise}
   */
  this.calculateProperties = function (needed, cached, recursive) {
    let calculations = Promise.resolve();
    if (!this.calculating) {
      this.calculating = true;
      let props = this.getMetaClass().getPropertyMetas();
      recursive = (recursive === false) ? false : true;

      this.stringValue = this.stringValue || id;
      if (this.classMeta.isSemanticCached()) {
        this.stringValue = this.base.__semantic;
      }

      if (!this.classMeta.isSemanticCached()) {
        calculations = calculations
          .then(() => this.classMeta.getSemantics(this))
          .then((v) => {
            this.stringValue = v;
          });
      }

      props.forEach((p) => {
        if (!needed || needed.hasOwnProperty(p.name)) {
          if (p.type === PropertyTypes.COLLECTION) {
            let result = '';
            let agregates = this.property(p.name).evaluate();
            if (Array.isArray(agregates)) {
              agregates.forEach((item) => {
                calculations = calculations
                  .then(() => recursive ? item.calculateProperties(null, cached, recursive) : null)
                  .then(() => (typeof p.semanticGetter === 'function') ? p.semanticGetter.apply(item) : item.toString())
                  .then((v) => {
                    result = result + (result ? ' ' : '') + v;
                  });
              });
              calculations = calculations.then(() => {
                this.properties[p.name].displayValue = result;
              });
            }
          }

          if (p.type === PropertyTypes.REFERENCE) {
            let agr = this.property(p.name).evaluate();
            if (agr) {
              calculations = calculations
                .then(() => recursive ? agr.calculateProperties(null, cached, recursive) : null)
                .then(() => (typeof p.semanticGetter === 'function') ? p.semanticGetter.apply(agr) : agr.toString())
                .then((v) => {
                  this.properties[p.name].displayValue = v;
                });
            }
          }
        }
      });

      props.forEach((p) => {
        if (p._formula && (!p.cached || cached) && (!needed || needed.hasOwnProperty(p.name))) {
          calculations = calculations.then(() => p._formula.apply(this))
            .then((result) => {
              if (p.type === PropertyTypes.REFERENCE && result instanceof Item) {
                this.references[p.name] = result;
                this.calculated[p.name] = result.getItemId();
              } else if (p.type === PropertyTypes.COLLECTION
                && Array.isArray(result)
                && result.length === result.filter(r => r instanceof Item).length) {
                this.collections[p.name] = result;
                this.calculated[p.name] = result.map(r => r.getItemId());
              } else {
                this.calculated[p.name] = cast(result, p.type);
              }
            });
        }
      });

      if (!this.classMeta.isSemanticCached()) {
        calculations = calculations
          .then(() => this.classMeta.getSemantics(this))
          .then((v) => {
            this.stringValue = v;
          });
      }
    }
    return calculations.then(() => {
      delete this.calculating;
      return this;
    });
  };
}

Item.prototype.toString = function () {
  return this.stringValue || this.getItemId();
};

module.exports = Item;
