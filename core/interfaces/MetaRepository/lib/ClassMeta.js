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
      var result = [];
      for (var j = 0; j < this.matrix.length; j++) {
        if (
          !Array.isArray(this.matrix[j].conditions) ||
          this.matrix[j].conditions.length === 0 ||
          checkConditions(item, this.matrix[j].conditions)) {
          Array.prototype.push.apply(result, this.matrix[j].result || []);
        }
      }
      return result;
    };
  }

  function sysPm(name) {
    return {
      orderNumber: 0,
      name: name,
      caption: name,
      type: 0,
      size: 500,
      decimals: 0,
      allowedFileTypes: null,
      maxFileCount: 0,
      nullable: true,
      readonly: true,
      indexed: false,
      unique: false,
      autoassigned: false,
      hint: null,
      defaultValue: null,
      refClass: "",
      itemsClass: "",
      backRef: "",
      backColl: "",
      binding: "",
      semantic: null,
      selConditions: [],
      selSorting: [],
      selectionProvider: null,
      indexSearch: false,
      eagerLoading: false,
      formula: null
    };
  }

  if (!plain.ancestor) {
    cm.propertyMetas.__class = sysPm('__class');
    cm.propertyMetas.__classTitle = sysPm('__classTitle');
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

    if (this.getAncestor()) {
      return this.getAncestor().getSemantics(item, dateCallback, circular);
    }

    return item.getItemId();
  };

  this.getSemanticAttrs = function () {
    return this.plain.semantic && this._semanticAttrs.length ?
      this._semanticAttrs :
      this.getAncestor() ? this.getAncestor().getSemanticAttrs() : [];
  };

  this.getForcedEnrichment = function () {
    return this._forcedEnrichment;
  };

  this.getKeyProperties = function () {
    if (!this.plain.key || Array.isArray(this.plain.key) && this.plain.key.length === 0) {
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

  this.getCreatorTracker = function () {
    if (!this.plain.creatorTracker && this.ancestor) {
      return this.ancestor.getCreatorTracker();
    }
    return this.plain.creatorTracker;
  };

  this.getEditorTracker = function () {
    if (!this.plain.editorTracker && this.ancestor) {
      return this.ancestor.getEditorTracker();
    }
    return this.plain.editorTracker;
  };
}

module.exports = ClassMeta;
