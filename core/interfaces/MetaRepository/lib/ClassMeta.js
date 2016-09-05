// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
/**
 * Created by Vasiliy Ermilov (email: inkz@xakep.ru, telegram: @inkz1) on 12.04.16.
 */

var checkConditions = require('core/ConditionParser');

/* jshint maxstatements: 30 */
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
  }
}

function buildSemanticGetter(prop,start,count) {
  if (typeof start !== 'undefined') {
    return function () {
      var p = this.property(prop);
      if (p === null) {
        return prop;
      }

      var v = this.get(prop);
      if (!v) {
        return '';
      }
      return v.toString().substr(start, count);
    };
  }
  return function () {
    var p = this.property(prop);
    if (p === null) {
      return prop;
    }

    var v = this.get(prop);
    if (!v) {
      return '';
    }
    return v.toString();
  };
}

function ClassMeta(metaObject) {

  var _this = this;

  this.namespace = '';

  this.plain = metaObject;

  this.ancestor = null;

  this.descendants = [];

  this.propertyMetas = {};

  var semanticFunc = null;

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
    if (this.plain.semantic && this.plain.semantic.trim()) {
      if (!semanticFunc) {
        var parts = this.plain.semantic.split('|');
        for (var i = 0; i < parts.length; i++) {
          if (parts[i].trim()) {
            var expr = parts[i].trim().match(/([^\[\s]*)(\s*\[\s*(\d+)\s*,\s*(\d+)\s*\])?/g);
            if (expr && expr.length > 4) {
              parts[i] = buildSemanticGetter(expr[1], parseInt(expr[3]), parseInt(expr[4]));
            } else {
              parts[i] = buildSemanticGetter(parts[i]);
            }
          }
        }

        semanticFunc = function () {
          var result = '';
          for (var i = 0; i < parts.length; i++) {
            result = result + (typeof parts[i] === 'function' ? parts[i].call(this) : parts[i]);
          }
          return result;
        };
      }
      return semanticFunc;
    }
    return '';
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
