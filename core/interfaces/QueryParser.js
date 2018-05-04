

function QueryParser() {

  /**
   * @param {String} query
   * @param {ClassMeta} cm
   * @returns {{}}
   */
  this.parse = function (query, cm) {
    return this._parse(query, cm);
  };

}

module.exports = QueryParser;
