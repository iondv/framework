'use strict';


function SequenceProvider () {
  /**
   * @param {String} name
   * @returns {Promise}
   */
  this.next = function (name) {
    return this._next(name);
  };

  /**
   * @param {String} name
   * @returns {Promise}
   */
  this.reset = function (name) {
    return this._reset(name);
  };
}

module.exports = SequenceProvider;