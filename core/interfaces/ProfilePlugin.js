/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 4/6/17.
 */
'use strict';

function ProfilePlugin() {

  /**
   *
   * @return {Promise}
   */
  this.preprocess = function () {
    return this._preprocess();
  };

  /**
   *
   * @param {{}} data
   * @return {Promise}
   */
  this.validate = function (data) {
    return this._validate(data);
  };

  /**
   *
   * @return {Promise}
   */
  this.inject = function () {
    return this._inject();
  };

}

module.exports = ProfilePlugin;
