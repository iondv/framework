const assert = require('assert');
const grammar = require('../grammar');
const nearley = require('nearley');
const F = require('../../../FunctionCodes');

function parse(query) {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  const results = parser.feed(query).results;
  if (results.length === 0) {
    throw new Error('Found no parsings.');
  }

  if (results.length > 1) {
    throw new Error('Ambiguous results.');
  }
  return results[0];
}

const queries = [{
  query: 'propertyName = 11',
  result: {[F.EQUAL]: [{val: 'propertyName'}, 11]}
},{
  query: 'propertyName = "some text"',
  result: {[F.EQUAL]: [{val: 'propertyName'}, 'some text']}
},{
  query: '`Атрибут` = 11',
  result: {[F.EQUAL]: [{val: 'Атрибут'}, 11]}
},{
  query: '`Атрибут` = "some text"',
  result: {[F.EQUAL]: [{val: 'Атрибут'}, 'some text']}
},{
  query: 'propertyName LIKE "some text"',
  result: {[F.LIKE]: [{val: 'propertyName'}, 'some text']}
},{
  query: '1 != "some text"',
  result: {[F.NOT_EQUAL]: [1, 'some text']}
},{
  query: 'prop1 >= 11 AND `attr2` LIKE "test"',
  result: {[F.AND]: [
    {[F.GREATER_OR_EQUAL]: [{val: 'prop1'}, 11]},
    {[F.LIKE]: [{val: 'attr2'}, 'test']}
  ]}
},{
  query: '(prop1 >= 11 AND `attr2` LIKE "test") OR prop3 != "blabla"',
  result: {[F.OR]: [
    {[F.AND]: [
      {[F.GREATER_OR_EQUAL]: [{val: 'prop1'}, 11]},
      {[F.LIKE]: [{val: 'attr2'}, 'test']}
    ]},
    {[F.NOT_EQUAL]: [{val: 'prop3'}, 'blabla']}
  ]}
}];

describe('Тестирование nearley-грамматики парсера запросов', () => {
  queries.forEach(q => it(q.query, () => assert.deepEqual(parse(q.query), q.result)));
});
