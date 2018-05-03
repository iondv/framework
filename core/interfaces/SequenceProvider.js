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
   * @param {Number} [value]
   * @returns {Promise}
   */
  this.reset = function (name, value) {
    return this._reset(name, value);
  };

  /**
   * @param {String} [name]
   */
  this.snapshot = function (name) {
    return this._snapshot(name);
  };
}

module.exports = SequenceProvider;