/**
 * Created by kalias_90 on 13.11.17.
 */
'use strict';

module.exports = function (disabled) {
  return function (req, res, next) {
    if (!disabled) {
      res.cookie('lastUrl', req.originalUrl);
    }
    next();
  };
};
