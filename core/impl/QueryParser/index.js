const IQueryParser = require('core/interfaces/QueryParser');
const nearley = require('nearley');
const grammar = require('./grammar');

function QueryParser() {

  this._parse = function (query) {
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
    let results = parser.feed(query).results;

    if (results.length === 0) {
      throw new Error('Found no parsings.');
    }

    if (results.length > 1) {
      throw new Error('Ambiguous results.');
    }

    return results[0];
  };

}

QueryParser.prototype = new IQueryParser();
module.exports = QueryParser;
