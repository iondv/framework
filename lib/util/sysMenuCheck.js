'use strict';

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
      p = p.then(() => auth.checkPathAccess(req, '/' + mi.name))
        .then((can) => {
          if (can) {
            result.push(mi);
          }
        });
    });
  }
  return p.then(() => result);
}

module.exports = function (scope, app) {
  return function (req, res, next) {
    check(scope.auth, req, app.locals.sysMenu)
      .then((menu) => {
        res.locals.sysMenu = menu;
        if (app.locals.explicitTopMenu) {
          return check(scope.auth, req, app.locals.explicitTopMenu);
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
