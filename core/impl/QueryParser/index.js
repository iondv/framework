const IQueryParser = require('core/interfaces/QueryParser');
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

  function parseAttrs(obj, cm) {
    if (Array.isArray(obj)) {
      let results = [];
      obj.forEach(o => results.push(parseAttrs(o, cm)));
      return results;
    } else {
      if (obj instanceof Attr) {
        let value = obj.value;
        let pm = cm.getPropertyMeta(value);
        if (!pm) {
          let propertyMetas = cm.getPropertyMetas();
          propertyMetas.forEach(p => {
            if (p.caption === value) {
              pm = p;
            }
          });
        }
        if (!pm) {
          throw new Error('invalid attr value');
        }
        return '$' + pm.name;
      } else if (typeof obj === 'object') {
        let result = {};
        Object.keys(obj).forEach(k => {
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
