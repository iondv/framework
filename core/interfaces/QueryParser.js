

function QueryParser() {

  /**
   * @param {String} query
   * @returns {{}}
   */
  this.parse = function (query) {
    return this._parse(query);
  };

}

module.exports = QueryParser;
