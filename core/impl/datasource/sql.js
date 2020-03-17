module.exports = {
  select: () => {
    //TODO
  },
  insert: () => {
    //TODO
    const values = [];
    const fields = [];
    const params = [];
    Object.keys(data).forEach((k, i) => {
      params.push(`$${i + 1}`);
      fields.push(k);
      values[i] = data[k];
    });
    /*{
      text: `INSERT INTO ${type}(${fields.join(',')}) VALUES (${params.join(',')})`,
      values
    };*/
  },
  delete: () => {
    //TODO
  },
  update: () => {
    //TODO
  }
};