/* eslint-disable max-statements */
const Operations = require('core/FunctionCodes');

/**
 * @param {*} overriding
 * @param {Function} overriding.structuredField
 * @param {String} overriding.NOT_EQUAL
 * @param {Function} overriding.select
 * @param {{}} overriding.parseOperation
 * @param {Function} overriding.logCallback
 * @param {Function} overriding.result
 */
function SqlAdapter(overriding = {}) {
  const OPERS = {
    [Operations.EMPTY]: 'IS NULL',
    [Operations.NOT_EMPTY]: 'IS NOT NULL',
    [Operations.EQUAL]: '=',
    [Operations.NOT_EQUAL]: overriding.NOT_EQUAL || '<>',
    [Operations.GREATER]: '>',
    [Operations.LESS]: '<',
    [Operations.GREATER_OR_EQUAL]: '>=',
    [Operations.LESS_OR_EQUAL]: '<=',
    [Operations.ADD]: '+',
    [Operations.SUB]: '-',
    [Operations.MUL]: '*',
    [Operations.DIV]: '/',
    [Operations.MOD]: '%',
    [Operations.NOT]: 'NOT',
    [Operations.AND]: 'AND',
    [Operations.OR]: 'OR',
    [Operations.LIKE]: 'LIKE',
    [Operations.IN]: 'IN'
    // TODO Operations.CONTAINS
    // TODO Operations.DATE
    // TODO Operations.NOW
    // TODO Operations.DATE_ADD
    // TODO Operations.DATE_DIFF
    // TODO Operations.DATE_FORMAT
    // TODO Operations.DATE_YEAR
    // TODO Operations.DATE_MONTH
    // TODO Operations.DATE_DAY
    // TODO Operations.DATE_HOUR
    // TODO Operations.DATE_MINUTE
    // TODO Operations.DATE_SECOND
    // TODO Operations.ROUND
    // TODO Operations.CONCAT
    // TODO Operations.SUBSTR
    // TODO Operations.ABS
    // TODO Operations.MIN
    // TODO Operations.MAX
    // TODO Operations.AVG
    // TODO Operations.SUM
    // TODO Operations.COUNT
    // TODO Operations.FULL_TEXT_MATCH
    // TODO Operations.GEO_WITHIN
    // TODO Operations.GEO_INTERSECTS
    // TODO Operations.IF
    // TODO Operations.CASE
    // TODO Operations.IFNULL
    // TODO Operations.LITERAL
    // TODO Operations.SIZE
    // TODO Operations.FORMAT
    // TODO Operations.NUMBER_TO_WORDS
    // TODO Operations.TO_UPPER
    // TODO Operations.TO_LOWER
  };

  const parseField = (field, parts) => {
    if (parts.length && overriding.structuredField && typeof overriding.structuredField === 'function')
      return overriding.structuredField(field, parts);
    return field;
  };

  const postpred = (operation, operand) => `(${operand} ${operation})`;

  const binary = (operation, oper1, oper2) => {
    if (operation === OPERS[Operations.EQUAL] || operation === OPERS[Operations.NOT_EQUAL]) {
      if (oper1 === null || oper2 === null) {
        oper1 = oper1 === null ? oper2 : oper1;
        operation = operation === OPERS[Operations.EQUAL] ? OPERS[Operations.EMPTY] : OPERS[Operations.NOT_EMPTY];
        return postpred(operation, oper1);
      }
    }
    return `(${oper1} ${operation} ${oper2})`;
  };

  const prepareValue = value => value;

  // eslint-disable-next-line complexity
  const parseCondition = (cond, params, joins = []) => {
    if (Array.isArray(cond) && cond.length) {
      const attrs = cond.map(co => parseCondition(co, params, joins));
      return `(${attrs.join(` ${OPERS[Operations.AND]} `)})`;
    } else if (cond && typeof cond === 'object' && !(cond instanceof Date)) {
      const [oper] = Object.keys(cond);
      const attrs = cond[oper].map(attr => parseCondition(attr, params, joins));

      if (overriding.parseOperation && overriding.parseOperation[oper] && typeof overriding.parseOperation[oper] === 'function')
        return overriding.parseOperation[oper](attrs);

      switch (oper) {
        case Operations.EQUAL:
        case Operations.NOT_EQUAL:
        case Operations.LESS:
        case Operations.GREATER:
        case Operations.LESS_OR_EQUAL:
        case Operations.GREATER_OR_EQUAL:
        case Operations.ADD:
        case Operations.SUB:
        case Operations.MUL:
        case Operations.DIV:
        case Operations.MOD:
          return binary(OPERS[oper], attrs[0], attrs[1]);
        case Operations.EMPTY:
        case Operations.NOT_EMPTY:
          return postpred(OPERS[oper], attrs[0]);
        case Operations.NOT:
          return `(${OPERS[oper]} ${attrs[0]})`;
        case Operations.AND:
        case Operations.OR:
          return `(${attrs.join(` ${OPERS[oper]} `)})`;
        case Operations.LIKE:
          return binary(OPERS[oper], attrs[0], attrs[1]);
        case Operations.IN:
          return binary(OPERS[oper], attrs[0], `(${attrs.slice(1).join(',')})`);
        default: {
          throw new Error('Неизвестный оператор.');
        }
      }
    } else if (typeof cond === 'string' && cond[0] === '$') {
      const parts = cond.split('.');
      const field = parts[0].substring(1);
      for (let i = 0; i < joins.length; i++) {
        if (field === joins[i].alias || field === joins[i].table)
          return parseField(`${field}.${parts[1]}`, parts.slice(2));
      }
      return parseField(field, parts.slice(1));
    } else {
      params.push(prepareValue(cond));
      return `$${params.length}`;
    }
  };

  const parseSorting = (sort) => {
    Object.keys(sort).map(attr => `${attr} ${sort[attr] < 0 ? 'DESC' : 'ASC'}`).join(',');
  };

  const _select = (table, options) => {
    const {
      conditions, sort, count, joins: joinsConfig
    } = options;
    const top = count ? `TOP ${count}` : '';
    const select = '*';//TODO DISTINCT, FIELDS
    const joins = '';//TODO
    const params = [];
    const where = conditions ? `WHERE ${parseCondition(conditions, params, joinsConfig)}` : '';
    const orderBy = sort ? `ORDER BY ${parseSorting(sort)}` : '';
    const groupBy = '';//TODO GROUP BY

    if (overriding.select && typeof overriding.select === 'function') {
      return overriding.select(table,
        options,
        {
          top, select, joins, where, groupBy, orderBy
        },
        params);
    }
    return {
      text: `SELECT ${top} ${select} FROM ${table} ${joins} ${where} ${groupBy} ${orderBy};`,
      params
    };
  };

  this.select = (table, options) => {
    const result = _select(table, options);
    typeof overriding.logCallback === 'function' && overriding.logCallback(result);
    return typeof overriding.result === 'function' ? overriding.result(result) : result;
  };

  const _insert = (table, data) => {
    const params = [];
    const fields = [];
    const refs = [];

    Object.keys(data).forEach((column) => {
      fields.push(column);
      params.push(prepareValue(data[column]));
      refs.push(`$${params.length}`);
    });

    return {
      text: `INSERT INTO ${table} (${fields.join(',')}) VALUES (${refs.join(',')});`,
      params
    };
  };

  this.insert = (table, data) => {
    const result = _insert(table, data);
    typeof overriding.logCallback === 'function' && overriding.logCallback(result);
    return typeof overriding.result === 'function' ? overriding.result(result) : result;
  };

  const _delete = (table, condition) => {
    const params = [];
    const where = condition ? `WHERE ${parseCondition(condition, params)}` : '';
    return {
      text: `DELETE FROM ${table} ${where};`,
      params
    };
  };

  this.delete = (table, condition) => {
    const result = _delete(table, condition);
    typeof overriding.logCallback === 'function' && overriding.logCallback(result);
    return typeof overriding.result === 'function' ? overriding.result(result) : result;
  };

  const _update = (table, data, condition) => {
    const set = [];
    const params = [];
    Object.keys(data).forEach((column) => {
      params.push(prepareValue(data[column]));
      set.push(`${column}=$${params.length}`);
    });
    const where = condition ? `WHERE ${parseCondition(condition, params)}` : '';

    return {
      text: `UPDATE ${table} SET ${set.join(',')} ${where};`,
      params
    };
  };

  this.update = (table, data, condition) => {
    const result = _update(table, data, condition);
    typeof overriding.logCallback === 'function' && overriding.logCallback(result);
    return typeof overriding.result === 'function' ? overriding.result(result) : result;
  };
}

module.exports = SqlAdapter;
