/**
 * Created by krasilneg on 14.04.17.
 */
'use strict';

module.exports = {
  EQUAL: 'eq',
  NOT_EQUAL: 'ne',
  EMPTY: 'empty',
  NOT_EMPTY: 'nempty',
  LIKE: 'like',
  LESS: 'lt',
  MORE: 'gt',
  LESS_OR_EQUAL: 'lte',
  MORE_OR_EQUAL: 'gte',
  IN: 'in',
  CONTAINS: 'contains',
  AND: 'and',
  OR: 'or',
  NOT: 'not',
  DATE: 'date',
  DATEADD: 'dateadd',
  DATEDIFF: 'datediff',
  ADD: 'add',
  SUB: 'sub',
  MUL: 'mul',
  DIV: 'div',
  ROUND: 'round',
  CONCAT: 'concat',
  SUBSTR: 'substr',
  MOD: 'mod',
  ABS: 'abs',
  MIN: 'min',
  MAX: 'max',
  AVG: 'avg',
  SUM: 'sum',
  COUNT: 'count',
  FULL_TEXT_MATCH: 'match',
  GEO_WITHIN: 'geoWithin',
  GEO_INTERSECTS: 'geoIntersects'
};
