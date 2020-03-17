/* eslint-disable require-jsdoc */

function sqlAdapter() {

  const parseCondition = (condition, params) => {
    //TODO
    return {
      where: 'WHERE'
    };
  };

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

module.exports = sqlAdapter;
