const IQueryParser = require('core/interfaces/QueryParser');
const PropertyTypes = require('core/PropertyTypes');
const nearley = require('nearley');
const grammar = require('./grammar');
const {Attr} = require('./classes');

function QueryParser() {

  function parseGrammar(query) {
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
    let results = parser.feed(query).results;

    if (results.length === 0) {
      throw new Error('Found no parsings.');
    }

    if (results.length > 1) {
      throw new Error('Ambiguous results.');
    }

    return results[0];
  }

  function findPropertyMeta(name, cm) {
    var pm = cm.getPropertyMeta(name);
    var dot;
    if (pm) {
      return pm;
    } else if ((dot = name.indexOf('.')) >= 0) {
      pm =  cm.getPropertyMeta(name.substring(0, dot));
      if (pm && pm.type === PropertyTypes.REFERENCE) {
        return findPropertyMeta(name.substring(dot + 1), pm._refClass);
      }
    }
    return null;
  }

  function findPropertyMetaByCaption(caption, cm) {
    if (caption && cm) {
      let propertyMetas = cm.getPropertyMetas();
      for (let i = 0; i < propertyMetas.length; i++) {
        if (propertyMetas[i].caption === caption) {
          return propertyMetas[i];
        }
      }
    }
    return null;
  }

  function findPropertyByCaption(caption, cm) {
    let captionParts = caption.split('.');
    let pm = findPropertyMetaByCaption(captionParts[0], cm);
    if (pm && captionParts.length === 1) {
      return pm.name;
    } else if (pm && pm.type === PropertyTypes.REFERENCE) {
      const pmNames = [];
      let index = 0;
      let currentPm = pm;
      while (currentPm && captionParts[index]) {
        pmNames.push(currentPm.name);
        index++;
        if (pm.type === PropertyTypes.REFERENCE) {
          currentPm = findPropertyMetaByCaption(captionParts[index], pm._refClass);
        } else {
          currentPm = null;
        }
      }
      return pmNames.join('.');
    }
    return null;
  }

  function parseAttrs(obj, cm) {
    if (Array.isArray(obj)) {
      let results = [];
      obj.forEach(o => results.push(parseAttrs(o, cm)));
      return results;
    } else {
      if (obj instanceof Attr) {
        let value;
        let pm = findPropertyMeta(obj.value, cm);
        if (pm) {
          value = obj.value;
        } else {
          value = findPropertyByCaption(obj.value, cm);
        }
        if (!value) {
          throw new Error('invalid attr value');
        }
        return '$' + value;
      } else if (typeof obj === 'object') {
        let result = {};
        Object.keys(obj).forEach((k) => {
          result[k] = parseAttrs(obj[k], cm);
        });
        return result;
      }
    }
    return obj;
  }

  this._parse = function (query, cm) {
    let results = parseGrammar(query);
    results = parseAttrs(results, cm);
    return results;
  };

}

QueryParser.prototype = new IQueryParser();
module.exports = QueryParser;
