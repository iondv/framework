'use strict';
const url = require('url');

/**
 * @param {Auth} auth
 * @param {Request} req
 * @param {Array} sysMenu
 */
function check(auth, req, sysMenu) {
  let result = [];
  let p = Promise.resolve();
  if (Array.isArray(sysMenu)) {
    sysMenu.forEach((mi) => {
      p = p.then(() => {
        if (typeof mi !== 'object') {
          return true;
        }
        let path = '/' + mi.name;
        if (mi.url) {
          let u = url.parse(mi.url);
          if (u.host) {
            return true;
          } else {
            path = mi.url;
          }
        }
        return auth.checkPathAccess(req, path);
      }).then((can) => {
        if (can) {
          result.push(mi);
        }
      });
    });
  }
  return p.then(() => result);
}

module.exports = function (scope, app, module) {
  return function (req, res, next) {
    check(scope.auth, req, app.locals.sysMenu)
      .then((menu) => {
        res.locals.sysMenu = menu;
        let etmo = scope.settings.get(module + '.explicitTopMenu') || scope.settings.get('explicitTopMenu');
        if (Array.isArray(etmo)) {
          return check(scope.auth, req, etmo);
        }
        return null;
      })
      .then((expMenu) => {
        app.locals.explicitTopMenu = expMenu;
        next();
      })
      .catch((err) => {
        scope.sysLog.error(err);
        res.locals.sysMenu = [];
        next();
      });
  };
};
