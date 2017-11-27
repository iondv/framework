// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
/**
 * Created by Vasiliy Ermilov (email: inkz@xakep.ru, telegram: @inkz1) on 12.04.16.
 */

const ConditionParser = require('core/ConditionParser');
const clone = require('clone');

/* jshint maxstatements: 30, evil: true */

function ClassMeta(metaObject) {

  var _this = this;

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
    let result = [];
    for (let nm in this.propertyMetas) {
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
