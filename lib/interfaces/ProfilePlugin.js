/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 4/6/17.
 */
'use strict';

function ProfilePlugin() {

  /**
   *
   * @return {Promise}
   */
  this.fields = function () {
    return this._fields();
  };

  /**
   *
   * @param {{}} data
   * @return {Promise}
   */
  this.validate = function (data) {
    return this._validate(data);
  };
}

module.exports = ProfilePlugin;
