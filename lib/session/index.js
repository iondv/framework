/**
 * Created by kras on 19.07.16.
 */
/* eslint global-require:off */
'use strict';
const clone = require('clone');
const parseDuration = require('lib/duration');
const session = require('express-session');
const storeAdapter = require('./connect-adapter');
const {t} = require('core/i18n');

/**
 * @param {{}} options
 * @param {{}} options.session
 * @param {{}} options.storage
 * @param {{}} options.app
 * @constructor
 */
function SessionHandler(options) {

  if (!options || !options.storage) {
    throw new Error(t('Settings for session storage are not specified.'));
  }

  const exclusions = [];

  this.exclude = path => exclusions.push(path);

  this.init = function () {
    var sessOpts = clone(options.session || {});
    if (sessOpts.cookie && sessOpts.cookie.maxAge) {
      if (typeof sessOpts.cookie.maxAge === 'string') {
        sessOpts.cookie.maxAge = parseDuration(sessOpts.cookie.maxAge, true);
      }
    }
    return options.storage.dataSource.open()
      .then(() => {
        sessOpts.store = storeAdapter(session, options.storage.dataSource, options.storage.type, options.storage);
        const smw = session(sessOpts);

        if (options.app) {
          options.app.use((req, res, next) => {
            for (let i = 0; i < exclusions.length; i++) {
              let tmp = exclusions[i];
              if (tmp[0] !== '/') {
                tmp = '/' + tmp;
              }
              tmp = '^' + tmp.replace(/\*\*/g, '.*').replace(/\\/g, '\\\\').replace(/\//g, '\\/') + '$';
              if (new RegExp(tmp).test(req.path)) {
                return next();
              }
            }
            smw(req, res, next);
          });
        }
      });
  };
}

module.exports = SessionHandler;
