const Operations = require('core/FunctionCodes');
const DsOperations = require('core/DataSourceFunctionCodes');

function SqlAdapter() {

  const parseCondition = (c, params) => {
    if (c && typeof c === 'object' && !(c instanceof Date)) {
      const oper = Object.keys(c)[0];
      switch (oper) {
        case Operations.EQUAL: return binary('=', c[oper][0], c[oper][1], params);
        case Operations.NOT_EQUAL: return binary('<>', c[oper][0], c[oper][1], params);
        case Operations.EMPTY: //TODO
          break;
        case Operations.NOT_EMPTY: //TODO
          break;
        case Operations.CONTAINS: //TODO
          break;
        case Operations.LIKE: //TODO
          break;
        case Operations.LESS: //TODO
          break;
        case Operations.GREATER: //TODO
          break;
        case Operations.LESS_OR_EQUAL: //TODO
          break;
        case Operations.GREATER_OR_EQUAL: //TODO
          break;
        case Operations.IN: //TODO
          break;
        case Operations.AND: //TODO
          break;
        case Operations.OR: //TODO
          break;
        case Operations.NOT: //TODO
          break;
        case Operations.DATE: //TODO
          break;
        case Operations.NOW: //TODO
          break;
        case Operations.DATE_ADD: //TODO
          break;
        case Operations.DATE_DIFF: //TODO
          break;
        case Operations.DATE_FORMAT: //TODO
          break;
        case Operations.DATE_YEAR: //TODO
          break;
        case Operations.DATE_MONTH: //TODO
          break;
        case Operations.DATE_DAY: //TODO
          break;
        case Operations.DATE_HOUR: //TODO
          break;
        case Operations.DATE_MINUTE: //TODO
          break;
        case Operations.DATE_SECOND: //TODO
          break;
        case Operations.ADD: //TODO
          break;
        case Operations.SUB: //TODO
          break;
        case Operations.MUL: //TODO
          break;
        case Operations.DIV: //TODO
          break;
        case Operations.ROUND: //TODO
          break;
        case Operations.CONCAT: //TODO
          break;
        case Operations.SUBSTR: //TODO
          break;
        case Operations.MOD: //TODO
          break;
        case Operations.ABS: //TODO
          break;
        case Operations.MIN: //TODO
          break;
        case Operations.MAX: //TODO
          break;
        case Operations.AVG: //TODO
          break;
        case Operations.SUM: //TODO
          break;
        case Operations.COUNT: //TODO
          break;
        case Operations.FULL_TEXT_MATCH: //TODO
          break;
        case Operations.GEO_WITHIN: //TODO
          break;
        case Operations.GEO_INTERSECTS: //TODO
          break;
        case Operations.IF: //TODO
          break;
        case Operations.CASE: //TODO
          break;
        case Operations.IFNULL: //TODO
          break;
        case Operations.LITERAL: //TODO
          break;
        case Operations.SIZE: //TODO
          break;
        case Operations.FORMAT: //TODO
          break;
        case Operations.NUMBER_TO_WORDS: //TODO
          break;
        case Operations.TO_UPPER: //TODO
          break;
        case Operations.TO_LOWER: //TODO
          break;
        case DsOperations.JOIN_EXISTS: //TODO
          break;
        case DsOperations.JOIN_NOT_EXISTS: //TODO
          break;
        case DsOperations.JOIN_SIZE: //TODO
          break;
        default: //TODO error
      }
    } else if (typeof c === 'string' && c[0] === '$') {
      if (isAlias) {
        //TODO
      } else
        return this.parseField(c.substring(1));
    } else {
      params.push(this.prepareValue(c));
      return `$${params.length}`;
    }
  };

  this.parseField = (field) => {
    if (field.indexOf('.') > 0) {
      //TODO structured data overriding
      return field.substring(0, field.indexOf('.'));
    }
    return field;
  };

  const binary = (operation, oper1, oper2, params) => {
    if (operation === '=' || operation === '<>') {
      if (oper1 === null || oper2 === null) {
        oper1 = oper1 === null ? oper2 : oper1;
      }
      operation = operation === '=' ? 'IS NULL' : 'IS NOT NULL'
      return `${oper1} ${operation}`;
    }
    oper1 = parseCondition(oper1, params);
    oper2 = parseCondition(oper2, params);
    return `(${oper1}${operation}${oper2})`;
  }

  const prepareValue = (value) => {
    //TODO
    return value;
  };

  this.select = (table, condition) => {
    const select = 'DISTINCT *';//TODO
    const params = [];
    const {where} = parseCondition(condition, params);
    const orderBy = 'ORDER BY ??? ASC, ??? DESC';//TODO
    const groupBy = 'GROUP BY column_name(s)';//TODO
    return {
      text: `SELECT ${select} FROM ${table} ${where} ${groupBy} ${orderBy};`,
      params
    };
  };

  this.insert = (table, data) => {

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

  this.delete = (table, condition) => {
    const params = [];
    const {where} = parseCondition(condition, params);
    return {
      text: `DELETE FROM ${table} ${where};`,
      params
    };
  };

  this.update = (table, data, condition) => {
    const set = [];
    const params = [];
    Object.keys(data).forEach((column) => {
      params.push(prepareValue(data[column]));
      set.push(`${column}=${params.length}`);
    });
    const {where} = parseCondition(condition, params);

    return {
      text: `UPDATE ${table} SET ${set.join(',')} ${where};`,
      params
    };
  };
}

module.exports = SqlAdapter;
