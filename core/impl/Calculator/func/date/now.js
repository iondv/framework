/**
 * Created by kras on 03.11.16.
 */
'use strict';

module.exports = function () {
  return function (sync) {
    let now = new Date();
    if (sync) {
      return now;
    }
    return Promise.resolve(now);
  };
};

