// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
/**
 * Created by Vasiliy Ermilov (email: inkz@xakep.ru, telegram: @inkz1) on 12.04.16.
 */

var checkConditions = require('core/ConditionParser');
var PropertyTypes = require('core/PropertyTypes');

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

  for (i = 0; i < properties.length; i++) {
    cm.propertyMetas[properties[i].name] = properties[i];
    if (properties[i].selectionProvider) {
      if (properties[i].selectionProvider.type === 'SIMPLE') {
        properties[i].selectionProvider.getSelection = selectionConstructor1();
      } else if (properties[i].selectionProvider.type === 'MATRIX') {
        properties[i].selectionProvider.getSelection = selectionConstructor2();
      }
    }

    if (properties[i].type === PropertyTypes.REFERENCE && properties[i].semantic) {
      properties[i].semanticGetter = parseSemantics(properties[i].semantic.trim());
    }
  }
}

/**
 * @param {String} semantics
 * @returns {Function}
 */
function parseSemantics(semantics) {
  if (!semantics) {
    return new Function('', 'return this.getItemId();');
  }

  var getter = 'if(v&&v.trim()){var p=item.property(v);if(p) {return p.getDisplayValue();}}return v;';

  var body = semantics.replace(/\'/g, '\\\'').
  replace(/([^\[\|]+)\s*\[\s*(\d+)\s*,\s*(\d+)\s*\]/g, 'getter(this,\'$1\').substr($2, $3)').
  replace(/([^\[\|]+)\s*\[\s*(\d+)\s*\]/g, 'getter(this,\'$1\').substr($2)').
  replace(/([^\|]+)\s*/g, 'getter(this,\'$1\')').
  replace(/\|/g, ' + ');
  return new Function('', 'function getter(item, v) {' + getter + '} return ' + body);
}

function ClassMeta(metaObject) {

  var _this = this;

  this.namespace = '';

  this.plain = metaObject;

  this.ancestor = null;

  this.descendants = [];

  this.propertyMetas = {};

  var semanticFunc = parseSemantics(this.plain.semantic);

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

  this.getSemantic = function () {
    return semanticFunc;
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
    return this.plain.creationTracker;
  };

  this.getChangeTracker = function () {
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
    return this.propertyMetas[name];
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
}

module.exports = ClassMeta;
