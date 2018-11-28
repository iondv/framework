/**
 * Created by krasilneg on 28.11.18.
 */

'use strict';

const AclProvider = require('core/interfaces/AclProvider');
const Permissions = require('core/Permissions');
const clone = require('clone');
const F = require('core/FunctionCodes');

/**
 *
 * @param {{}} config
 * @param {String} [config.allAlias]
 * @param {DataSource} config.ds
 * @constructor
 */
function DsAcl(config) {

  const globalMarker = config.allAlias ? config.allAlias : '*';

  const roles_table = 'ion_acl_user_roles';

  const perms_table = 'ion_acl_permissions';

  /**
   * @returns {Promise}
   * @private
   */
  this._init = function () {
    return config.ds.ensureIndex(perms_table, {subject: 1, resource: 1, permission: 1}, {unique: true})
      .then(() => config.ds.ensureIndex(perms_table, {subject: 1}, {}))
      .then(() => config.ds.ensureIndex(roles_table, {user: 1}, {unique: true}));
  };

  /**
   * @param {String} subject
   * @param {String} resource
   * @param {String | String[]} permissions
   * @returns {Promise}
   */
  this._checkAccess = function (subject, resource, permissions) {
    const perms = Array.isArray(permissions) ? permissions.slice() : [permissions];
    if (perms.indexOf(Permissions.FULL) < 0) {
      perms.push(Permissions.FULL);
    }
    const res = [resource, globalMarker];
    const subj = [subject, globalMarker];

    return config.ds.get(roles_table, {[F.EQUAL]: ['$user', subject]})
      .then((roles) => {
        if (roles) {
          roles.roles.forEach((r) => {
            subj.push(r);
          });
        }

        return config.ds.fetch(
          perms_table,
          {
            filter: {
              [F.AND]: [
                {
                  [F.IN]: ['$subject', subj]
                },
                {
                  [F.IN]: ['$resource', res]
                },
                {
                  [F.IN]: ['$permission', perms]
                }
              ]
            }
          }
        );
      })
      .then(result => result.length ? true : false);
  };

  /**
   * @param {String} subject
   * @param {String | String[]} resources
   * @returns {Promise}
   */
  this._getPermissions = function (subject, resources, skipGlobals) {
    const r = Array.isArray(resources) ? resources.slice() : [resources];
    const returnGlobal = r.indexOf(globalMarker) >= 0;
    const subj = [subject];
    if (!skipGlobals) {
      if (r.indexOf(globalMarker) < 0) {
        r.push(globalMarker);
      }
      subj.push(globalMarker);
    }
    let res = null;
    return config.ds.get(roles_table, {[F.EQUAL]: ['$user', subject]})
      .then((roles) => {
        if (roles) {
          roles.roles.forEach((r) => {
            subj.push(r);
          });
        }

        return config.ds.fetch(
          perms_table,
          {
            filter: {
              [F.AND]: [
                {
                  [F.IN]: ['$subject', subj]
                },
                {
                  [F.IN]: ['$resource', res]
                }
              ]
            }
          }
        );
      })
      .then((result) => {

      });
    acl.allowedPermissions(subject, r, (err, perm) => {
      if (err) {
        return reject(err);
      }
      res = {};
      let hasGlobals = false;
      let globalPermissions = {};
      if (!skipGlobals) {
        if (perm.hasOwnProperty(_this.globalMarker)) {
          for (let i = 0; i < perm[_this.globalMarker].length; i++) {
            globalPermissions[perm[_this.globalMarker][i]] = true;
            hasGlobals = true;
          }
        }
      }

      if (perm.hasOwnProperty(_this.globalMarker) && !returnGlobal) {
        delete perm[_this.globalMarker];
      }

      for (let nm in perm) {
        if (perm.hasOwnProperty(nm)) {
          if (perm[nm].length || hasGlobals) {
            res[nm] = clone(globalPermissions);
            if (perm[nm].indexOf(Permissions.FULL) >= 0 || res[nm][Permissions.FULL]) {
              res[nm][Permissions.READ] = true;
              res[nm][Permissions.WRITE] = true;
              res[nm][Permissions.DELETE] = true;
              res[nm][Permissions.USE] = true;
              res[nm][Permissions.FULL] = true;
            } else {
              for (let i = 0; i < perm[nm].length; i++) {
                res[nm][perm[nm][i]] = true;
              }
            }
          }
        }
      }

      if (skipGlobals) {
        return resolve(res);
      }

      acl.allowedPermissions(_this.globalMarker, r, (err, perm) => {
        if (err) {
          return reject(err);
        }

        for (let nm in perm) {
          if (perm.hasOwnProperty(nm) && res.hasOwnProperty(nm)) {
            for (let i = 0; i < perm[nm].length; i++) {
              res[nm][perm[nm][i]] = true;
            }
          }
        }
        return resolve(res);
      });
    });
  }
)
)
;
}
;

/**
 * @param {String} subject
 * @param {String | String[]} permissions
 * @returns {Promise}
 */
this._getResources = function (subject, permissions) {
  let p = Array.isArray(permissions) ? permissions : [permissions];
  if (p.indexOf(_this.globalMarker) < 0) {
    p.push(_this._globalMarker);
  }
  return getAcl().then(acl => new Promise((resolve, reject) => {
    acl.userRoles(subject, (err, roles) => {
      if (err) {
        return reject(err);
      }
      acl.whatResources(roles, p, (err, resources) => err ? reject(err) : resolve(resources));
    });
  }));
};

/**
 * @param {String} subject
 * @returns {Promise}
 */
this._getCoactors = function (subject) {
  return getAcl().then(acl => new Promise((resolve, reject) => {
    acl.userRoles(subject, (err, roles) => err ? reject(err) : resolve(roles));
  }));
};
}

DsAcl.prototype = new AclProvider();

module.exports = DsAcl;
