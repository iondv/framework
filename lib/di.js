/**
 * Created by kras on 19.07.16.
 */
'use strict';

var di = require('core/di');
var config = require('../config');

module.exports = function (server, app) {
  return di(
    'app',
    config.di,
    {
      server: server,
      application: app
    }
  );
};
