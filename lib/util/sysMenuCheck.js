'use strict';

/**
 * @param {Auth} auth
 * @param sysMenu
 */
module.exports = function (auth, req, sysMenu) {
  let result = [];
  let p = Promise.resolve();
  if (Array.isArray(sysMenu)) {
    sysMenu.forEach((mi)=>{
      p = p.then(()=>auth.checkPathAccess(req, '/' + mi.name))
        .then((can)=>{
          if (can) {
            result.push(mi);
          }
        });
    });
  }
  return p.then(()=>result);
};
