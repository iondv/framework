/**
 * Created by kalias_90 on 13.11.17.
 */
'use strict';
const cookie = require('cookie');

var disabled;

module.exports = {
  enable: function () {
    disabled = false;
  },
  disable: function () {
    disabled = true;
  },
  get: function (req) {
    if (disabled) {
      return null;
    }
    let cks = req.cookies || cookie.parse(req.headers.cookie || '');
    return cks.lastVisit;
  },
  saver: function (req, res, next) {
    if (!disabled) {
      res.cookie('lastVisit', req.originalUrl);
    }
    next();
  }
};
