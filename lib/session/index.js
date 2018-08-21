/**
 * Created by kras on 19.07.16.
 */
'use strict';
const clone = require('clone');
const parseDuration = require('lib/duration');

/**
 * @param {{}} options
 * @param {{}} options.session
 * @param {{}} options.storage
 * @param {{}} options.app
 * @constructor
 */
function SessionHandler(options) {

  if (!options || !options.storage) {
    throw new Error('Не переданы настройки хранилища сессий');
  }

  const exclusions = [];

  this.exclude = path => exclusions.push(path);

  this.init = function () {
    // Инициализируем сессии
    var sessOpts = clone(options.session || {});
    if (sessOpts.cookie && sessOpts.cookie.maxAge) {
      if (typeof sessOpts.cookie.maxAge === 'string') {
        sessOpts.cookie.maxAge = parseDuration(sessOpts.cookie.maxAge, true);
      }
    }
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
      options.storage.getMiddleware(sessOpts)
        .then(smw => smw(req, res, next))
        .catch((err) => {
          options.log ? options.log.error(err) : console.error(err);
          res.sendStatus(500);
        });
    });
  };
}

module.exports = SessionHandler;
