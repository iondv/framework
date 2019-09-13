/**
 * @param {table: String, DataSource: dataSource} options
 * @param {class: Function, filter: Function} options.record
 */
module.exports = (options) => {
  this.logChange = (record) => {
    if (!(record instanceof options.record.class))
      throw new Error('Тип записи не соответствует журналу!');
    return options.dataSource.insert(options.table, record.normalize())
      .then(item => record);
  };

  this.getChanges = (filters, sort, offset, count, countTotal) => {
    return options.dataSource.fetch(options.table, {
      filter: options.record.filter(filters),
      sort, offset, count, countTotal
    }).then((changes) => {
      const result = [];
      for (let i = 0; i < changes.length; i++)
        result.push(new options.record.class(changes[i]));
      if (changes.total)
        result.total = changes.total;
      return Promise.resolve(result);
    });
  };
};