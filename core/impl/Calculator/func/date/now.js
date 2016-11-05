/**
 * Created by kras on 03.11.16.
 */
'use strict';

module.exports = function () {
  return function () {
    return new Promise(function (resolve) {
      resolve(new Date());
    });
  };
};

