/* eslint-disable max-lines */
/* eslint-disable max-statements */
/* eslint-disable func-names */

/**
 * Created by Vasiliy Ermilov (email: inkz@xakep.ru, telegram: @inkz1) on 29.04.16.
 */
'use strict';

const Property = require('./Property');
const PropertyTypes = require('core/PropertyTypes');
const cast = require('core/cast');

/**
 * @param {String} id
 * @param {{}} base
 * @param {ClassMeta} classMeta
 * @constructor
 */
function Item(id, base, classMeta) {
  const _this = this;

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

  this.emptify = function() {
    this.id = null;

    this.base = {};

    this.references = {};

    this.collections = {};

    this.calculated = {};

    this.files = {};

    this.slCacheClean = true;
  };

  this.getItemId = function() {
    return this.id;
  };

  this.getClassName = function() {
    return this.classMeta.getCanonicalName();
  };

  /**
   * @returns {ClassMeta}
   */
  this.getMetaClass = function() {
    return this.classMeta;
  };

  /**
   * @returns {String}
   */
  this.getCreator = function() {
    return this.base._creator;
  };

  /**
   * @returns {String}
   */
  this.getEditor = function() {
    return this.base._editor;
  };

  /**
   * @param {String} name
   * @returns {Item | null}
   */
  this.getAggregate = function(name) {
    const prop = this.getProperties()[name];
    if (prop && prop.getType() === PropertyTypes.REFERENCE)
      return this.references[name] || null;
    return null;
  };

  /**
   * @param {String} name
   * @returns {Array | null}
   */
  this.getAggregates = function(name) {
    const prop = this.getProperties()[name];
    if (prop && prop.getType() === PropertyTypes.COLLECTION && this.collections)
      return this.collections[name] || null;
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

  this.get = function(name) {
    if (name === '__class')
      return this.getClassName();

    if (name === '__classTitle')
      return this.getMetaClass().getCaption();

    const dot = name.indexOf('.');
    if (dot > -1) {
      const pn = name.substring(0, dot);
      const props = this.getProperties();
      if (props.hasOwnProperty(pn)) {
        if (props[pn].getType() === PropertyTypes.REFERENCE) {
          const i = this.getAggregate(pn);
          if (i)
            return i.get(name.substring(dot + 1));
        } else if (props[pn].getType() === PropertyTypes.COLLECTION) {
          const is = this.getAggregates(pn);
          if (Array.isArray(is)) {
            const result = [];
            for (let i = 0; i < is.length; i++)
              result.push(is[i].get(name.substring(dot + 1)));
            return result;
          }
        }
      }
      return null;
    }
    return getFromBase(name);
  };

  this.set = function(name, value) {
    const dot = name.indexOf('.');
    if (dot > -1) {
      const i = this.getAggregate(name.substring(0, dot));
      if (i)
        i.set(name.substring(dot + 1), value);
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
      const pm = cm.getPropertyMeta(nm.substring(0, dot));
      if (!pm)
        throw new Error(`Не найден атрибут ${nm} класса ${cm.getCanonicalName()}`);
      if (pm.type === PropertyTypes.REFERENCE || pm.type === PropertyTypes.COLLECTION)
        return findPropertyMeta(nm.substring(dot + 1), pm._refClass);
      return null;
    }
    return cm.getPropertyMeta(nm);
  }

  /**
   * @param {String} name
   * @returns {Property | null}
   */
  this.property = function(name) {
    const props = this.getProperties();
    if (props.hasOwnProperty(name))
      return props[name];
    const pm = findPropertyMeta(name, this.classMeta);
    if (pm)
      return new Property(this, pm, name);
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
   * @param {Boolean} [recursive]
   * @returns {Promise}
   */
  this.calculateProperties = function(needed, cached, recursive) {
    let calculations = Promise.resolve();
    if (!this.calculating) {
      this.calculating = true;
      const props = this.getMetaClass().getPropertyMetas();
      recursive = recursive !== false;

      this.stringValue = this.stringValue || id;
      if (this.classMeta.isSemanticCached())
        this.stringValue = this.base.__semantic;

      if (!this.classMeta.isSemanticCached()) {
        calculations = calculations
          .then(() => this.classMeta.getSemantics(this))
          .then((val) => {
            this.stringValue = val;
          });
      }

      props.forEach((prop) => {
        if (!needed || needed.hasOwnProperty(prop.name)) {
          if (prop.type === PropertyTypes.COLLECTION) {
            let result = '';
            const agregates = this.property(prop.name).evaluate();
            if (Array.isArray(agregates)) {
              agregates.forEach((item) => {
                calculations = calculations
                  // eslint-disable-next-line no-confusing-arrow
                  .then(() => recursive ? item.calculateProperties(null, cached, recursive) : null)
                  // eslint-disable-next-line no-confusing-arrow
                  .then(() => (typeof prop.semanticGetter === 'function') ? prop.semanticGetter.apply(item) : item.toString())
                  .then((val) => {
                    result = result + (result ? ' ' : '') + val;
                  });
              });
              calculations = calculations.then(() => {
                this.properties[prop.name].displayValue = result;
              });
            }
          }

          if (prop.type === PropertyTypes.REFERENCE) {
            const agr = this.property(prop.name).evaluate();
            if (agr) {
              calculations = calculations
                // eslint-disable-next-line no-confusing-arrow
                .then(() => recursive ? agr.calculateProperties(null, cached, recursive) : null)
                // eslint-disable-next-line no-confusing-arrow
                .then(() => (typeof prop.semanticGetter === 'function') ? prop.semanticGetter.apply(agr) : agr.toString())
                .then((val) => {
                  this.properties[prop.name].displayValue = val;
                });
            }
          }
        }
      });

      props.forEach((prop) => {
        if (prop._formula && (!prop.cached || cached) && (!needed || needed.hasOwnProperty(prop.name))) {
          calculations = calculations.then(() => prop._formula.apply(this))
            .then((result) => {
              if (prop.type === PropertyTypes.REFERENCE && result instanceof Item) {
                this.references[prop.name] = result;
                this.calculated[prop.name] = result.getItemId();
              } else if (prop.type === PropertyTypes.COLLECTION &&
                Array.isArray(result) &&
                result.length === result.filter(res => res instanceof Item).length) {
                this.collections[prop.name] = result;
                this.calculated[prop.name] = result.map(res => res.getItemId());
              } else {
                this.calculated[prop.name] = cast(result, prop.type);
              }
            });
        }
      });

      if (!this.classMeta.isSemanticCached()) {
        calculations = calculations
          .then(() => this.classMeta.getSemantics(this))
          .then((val) => {
            this.stringValue = val;
          });
      }
      calculations.then(() => {
        delete this.calculating;
      });
    }
    return calculations.then(() => this);
  };
}

Item.prototype.toString = function() {
  return this.stringValue || this.getItemId();
};

module.exports = Item;
