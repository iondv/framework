/**
 * Created by krasilneg on 25.02.17.
 */
'use strict';

function Iterator() {
  /**
   * @returns {Promise}
   */
  this.next = function () {
    return this._next();
  };

  /**
   * @returns {Number}
   */
  this.count = function () {
    return this._count();
  };
}

module.exports = Iterator;
