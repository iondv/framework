
/**
 * @param {table: String, DataSource: dataSource} options
 * @param {Function} options.recordClass
 * @param {{}} options.types
 */
module.exports = (options) => {
  const self = this;

  this.types = () => {
    return null;
  };

  this.logChange = (type, datas) => {
    if (!this.types()[type.toUpperCase()])
      throw new Error('Неверно указан тип записи журнала изменений!');
    const record = this._normalize(datas);
    record.timestamp = new Date();
    record.type = type;
    return options.dataSource.insert(options.table, record);
  };

  this.getChanges = (filters, sort, offset, count, countTotal) => {
    return options.dataSource.fetch(options.table, {
      filter: this._filter(filters),
      sort, offset, count, countTotal
    }).then((changes) => {
      const result = [];
      changes.forEach(ch => result.push(self._record(ch)));
      result.total = changes.total;
      return result;
    });
  };
};
