// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
/**
 * Created by Vasiliy Ermilov (email: inkz@xakep.ru, telegram: @inkz1) on 12.04.16.
 */

var checkConditions = require('core/ConditionChecker');
var clone = require('clone');

/* jshint maxstatements: 30, evil: true */
function loadPropertyMetas(cm, plain) {
  var i, properties;
  properties = plain.properties.sort(function (a,b) {
    return a.orderNumber - b.orderNumber;
  });

  function selectionConstructor1() {
    return function () {
      return this.list || [];
    };
  }

  function selectionConstructor2() {
    /**
     * @param {Item} item
     */
    return function (item) {
      for (var j = 0; j < this.matrix.length; j++) {
        if (checkConditions(item, this.matrix[j].conditions)) {
          return this.matrix[j].result || [];
        }
      }
      return [];
    };
  }
  var pm;
  for (i = 0; i < properties.length; i++) {
    pm = clone(properties[i]);
    cm.propertyMetas[properties[i].name] = pm;
    if (pm.selectionProvider) {
      if (pm.selectionProvider.type === 'SIMPLE') {
        pm.selectionProvider.getSelection = selectionConstructor1();
      } else if (properties[i].selectionProvider.type === 'MATRIX') {
        pm.selectionProvider.getSelection = selectionConstructor2();
      }
    }
  }
}

function ClassMeta(metaObject) {

  var _this = this;

  this.namespace = '';

  this.plain = metaObject;

  this.ancestor = null;

  this.descendants = [];

  this.propertyMetas = {};

  this._forcedEnrichment = [];

  this._semanticAttrs = [];

  this._semanticFunc = null;

  loadPropertyMetas(_this, metaObject);

  this.getVersion = function () {
    return this.plain.version;
  };

  this.getName = function () {
    return this.plain.name;
  };

  this.getCaption = function () {
    return this.plain.caption;
  };

  this.getNamespace = function () {
    return this.namespace;
  };

  this.getCanonicalName = function () {
    return this.plain.name + (this.namespace ? '@' + this.namespace : '');
  };

  this.getSemantics = function (item, dateCallback, circular) {
    if (typeof this._semanticFunc === 'function') {
      return this._semanticFunc.call(item, dateCallback, circular);
    }
    return item.getItemId();
  };

  this.getSemanticAttrs = function () {
    return this._semanticAttrs || [];
  };

  this.getForcedEnrichment = function () {
    return this._forcedEnrichment;
  };

  this.getKeyProperties = function () {
    if (!this.plain.key) {
      var anc = this.getAncestor();
      if (anc !== null) {
        return anc.getKeyProperties();
      }
    }
    return this.plain.key;
  };

  this.getContainerReference = function () {
    return this.plain.container;
  };

  this.getCreationTracker = function () {
    if (!this.plain.creationTracker && this.ancestor) {
      return this.ancestor.getCreationTracker();
    }
    return this.plain.creationTracker;
  };

  this.getChangeTracker = function () {
    if (!this.plain.changeTracker && this.ancestor) {
      return this.ancestor.getChangeTracker();
    }
    return this.plain.changeTracker;
  };

  this.getAncestor = function () {
    return this.ancestor;
  };

  this.checkAncestor = function (name) {
    if (name === this.getName()) {
      return this;
    }
    var parent = this.getAncestor();
    if (parent) {
      return parent.checkAncestor(name);
    }
    return null;
  };

  this.getDescendants = function () {
    return this.descendants;
  };

  this.getPropertyMeta = function (name) {
    if (!this.propertyMetas.hasOwnProperty(name)) {
      if (this.getAncestor()) {
        return this.ancestor.getPropertyMeta(name);
      }
    }
    return this.propertyMetas[name] || null;
  };

  this.getPropertyMetas = function () {
    var result = [];
    for (var nm in this.propertyMetas) {
      if (this.propertyMetas.hasOwnProperty(nm)) {
        result.push(this.propertyMetas[nm]);
      }
    }
    if (this.getAncestor()) {
      result = result.concat(this.getAncestor().getPropertyMetas());
    }
    return result;
  };
  
  this.isJournaling = function () {
	  return this.plain.journaling;
  };
}

module.exports = ClassMeta;
