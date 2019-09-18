class LogRecord {

  constructor(datas, type) {
    this.base = datas;
    if (type) {
      let t = LogRecord.types()[type.toUpperCase()];
      if (!t)
        throw new Error('Неверно указан тип записи журнала изменений!');
      this.base.type = t;
    }
  }

  static types() {
    return {};
  }

  /**
   * @returns {{}}
   */
  normalize() {
    return this.datas;
  }

  /**
   * @param {{}} filters
   * @returns {{}}
   */
  static getFilter(filters) {
    return filters;
  }
}

/**
 * @param {table: String, DataSource: dataSource} options
 * @param {Function} options.recordClass
 */
module.exports = (options) => {
  this.logChange = (record) => {
    if (!(record instanceof options.recordClass))
      throw new Error('Тип записи не соответствует журналу!');
    return options.dataSource.insert(options.table, record.normalize())
      .then(item => record);
  };

  this.getChanges = (filters, sort, offset, count, countTotal) => {
    return options.dataSource.fetch(options.table, {
      filter: options.recordClass.getFilter(filters),
      sort, offset, count, countTotal
    }).then((changes) => {
      const result = [];
      for (let i = 0; i < changes.length; i++)
        result.push(new options.recordClass(changes[i]));
      if (changes.total)
        result.total = changes.total;
      return Promise.resolve(result);
    });
  };
};

module.exports.logRecord = LogRecord;
