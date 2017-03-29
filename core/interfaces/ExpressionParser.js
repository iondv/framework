/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 3/29/17.
 */
'use strict';

/**
 *
 * @constructor
 */
function ExpressionParser() {

  /**
   *
   * @param {String} src
   * @return {Function}
   */
  this.compile = function (src) {
    return this._compile(src);
  };

}

module.exports = ExpressionParser;
