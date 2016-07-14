// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
/**
 * Created by Vasiliy Ermilov (email: inkz@xakep.ru, telegram: @inkz1) on 12.04.16.
 */
'use strict';

function ClassMeta(metaObject,metaRepository) {

  var _this = this;

  this.namespace = '';

  this.plain = metaObject;

  this.metaRepository = metaRepository;

  this.ancestor = null;

  this.descendants = [];

  this.propertyMetas = {};

  var semanticFunc = null;

  (function loadPropertyMetas(plain) {
    var i,j,k,properties, key, v;
    properties = plain.properties.sort(function (a,b) {
      return a.order_number - b.order_number;
    });

    function selectionConstructor1() {
      return function (item) {
        return this.selection;
      };
    }

    function selectionConstructor2() {
      /**
       * @param {Item} item
       */
      return function (item) {
        var found, pn, v, j, k;
        for (j = 0; j < this.matrix.length; j++) {
          found = true;
          for (k = 0; k < this.matrix[j].conditions.length; k++) {
            pn = this.matrix[j].conditions[k].property;
            v = this.matrix[j].conditions[k].value;
            switch (this.matrix[j].conditions[k].operation) {
              case 0:found = String(item.get(pn)) === v ? true : false;break;
              case 1:found = String(item.get(pn)) !== v ? true : false;break;
              case 2:found = !item.get(pn) ? true : false;break;
              case 3:found = item.get(pn) ? true : false;break;
              case 4:found = String(item.get(pn)).match(new RegExp(v)) ? true : false;break;
              case 5:found = item.get(pn) < v ? true : false;break;
              case 6:found = item.get(pn) > v ? true : false;break;
              case 7:found = item.get(pn) <= v ? true : false;break;
              case 8:found = item.get(pn) >= v ? true : false;break;
              case 9:
              case 10:found = item.get(pn).indexOf(v) !== -1 ? true : false;break;
            }
            if (!found) {
              break;
            }
          }

          if (found) {
            return this.matrix[j].selection;
          }
        }
      };
    }

    for (i = 0; i < properties.length; i++) {
      _this.propertyMetas[properties[i].name] = properties[i];
      if (properties[i].selection_provider) {
        if (properties[i].selection_provider.type === 'SIMPLE') {
          properties[i].selection_provider.selection = {};
          for (j = 0; j < properties[i].selection_provider.list.length; j++) {
            key = properties[i].selection_provider.list[j].key;
            properties[i].selection_provider.selection[key] = properties[i].selection_provider.list[j].value;
          }
          properties[i].selection_provider.getSelection = selectionConstructor1();
        } else if (properties[i].selection_provider.type === 'MATRIX') {
          for (j = 0; j < properties[i].selection_provider.matrix.length; j++) {
            properties[i].selection_provider.matrix[j].selection = {};
            for (k = 0; k < properties[i].selection_provider.matrix[j].result.length; k++) {
              key = properties[i].selection_provider.matrix[j].result[k].key;
              v = properties[i].selection_provider.matrix[j].result[k].value;
              properties[i].selection_provider.matrix[j].selection[key] = v;
            }
          }
          properties[i].selection_provider.getSelection = selectionConstructor2();
        }
      }
    }
  })(metaObject);

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
          /**
           * @type {Item} Функция будет всегда вызываться относительно объекта типа Item
           */
          var _this = this;
          var result = '';
          for (var i = 0; i < parts.length; i++) {
            result = result + (typeof parts[i] === 'function') ? parts[i].call(_this) : parts[i];
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
    result = result.concat(this.plain.properties);
    if (this.getAncestor()) {
      result = result.concat(this.getAncestor().getPropertyMetas());
    }
    return result;
  };

}

module.exports = ClassMeta;
