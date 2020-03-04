/**
 * Created by Vasiliy Ermilov (email: inkz@xakep.ru, telegram: @inkz1) on 12.04.16.
 */
'use strict';
const clone = require('clone');

/* jshint maxstatements: 30, evil: true */

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
    refClass: '',
    itemsClass: '',
    backRef: '',
    backColl: '',
    binding: '',
    semantic: null,
    selConditions: [],
    selSorting: [],
    selectionProvider: null,
    indexSearch: false,
    eagerLoading: false,
    formula: null
  };
}

/**
 * @param {ClassMeta} cm
 */
function loadPropertyMetas(cm) {
  let properties = cm.plain.properties.sort(function (a,b) {
    return a.orderNumber - b.orderNumber;
  });

  if (!cm.plain.ancestor) {
    cm.propertyMetas.__class = sysPm('__class');
    cm.propertyMetas.__classTitle = sysPm('__classTitle');
  }

  for (let i = 0; i < properties.length; i++) {
    let pm = clone(properties[i]);
    pm.definitionClass = cm.getCanonicalName();
    cm.propertyMetas[properties[i].name] = pm;
    if (pm.eagerLoading) {
      cm._forcedEnrichment.push(pm.name);
    }
  }
}

function ClassMeta(metaObject) {

  this.plain = metaObject;

  this.ancestor = null;

  this.descendants = [];

  this.propertyMetas = {};

  this._forcedEnrichment = [];

  this._semanticAttrs = [];

  this._semanticFunc = null;

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
    return this.plain.namespace;
  };

  this.getCanonicalName = function () {
    return this.plain.name + (this.plain.namespace ? '@' + this.plain.namespace : '');
  };

  this.getSemantics = function (item) {
    if (typeof this._semanticFunc === 'function') {
      return this._semanticFunc.call(item);
    }

    if (this.getAncestor()) {
      return this.getAncestor().getSemantics(item);
    }

    return Promise.resolve(item.getItemId());
  };

  this.isSemanticCached = function () {
    return this.plain.semanticCached;
  };

  this.getCacheDependencies = function () {
    let result = [];
    if (this.getAncestor()) {
      result.push(...this.getAncestor().getCacheDependencies());
    }
    if (Array.isArray(this.plain.cacheDependencies)) {
      this.plain.cacheDependencies.forEach((a) => {
        result.push(a.split('.'));
      });
    }
    return result;
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
      let anc = this.getAncestor();
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
    if (name.indexOf('@') < 0) {
      name = name + '@' + this.getNamespace();
    }
    if (name === this.getCanonicalName()) {
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
    let result = {};
    if (this.getAncestor()) {
      let apm = this.getAncestor().getPropertyMetas();
      apm.forEach((pm) => {
        result[pm.name] = pm;
      });
    }

    for (let nm in this.propertyMetas) {
      if (this.propertyMetas.hasOwnProperty(nm)) {
        result[nm] = this.propertyMetas[nm];
      }
    }
    return Object.values(result).sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0));
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

  this.isAbstract = function () {
    return this.plain.abstract;
  };

  loadPropertyMetas(this);
}

module.exports = ClassMeta;
