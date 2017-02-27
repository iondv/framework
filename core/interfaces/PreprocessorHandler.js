/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 2/27/17.
 */
'use strict';

function PreprocessorHandler() {

  /**
   *
   * @param {{}} value
   * @param {Item} item
   */
  this.handle = function (value, item) {
    return this._handle(value, item);
  };

}

module.exports = PreprocessorHandler;
