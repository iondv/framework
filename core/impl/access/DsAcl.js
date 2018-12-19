/**
 * Created by krasilneg on 28.11.18.
 */

'use strict';

const AclProvider = require('core/interfaces/AclProvider');
const Permissions = require('core/Permissions');
const merge = require('merge');
const F = require('core/FunctionCodes');

/**
 *
 * @param {{}} config
 * @param {String} [config.allAlias]
 * @param {DataSource} config.dataSource
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
    return config.dataSource.ensureIndex(perms_table, {subject: 1, resource: 1, permission: 1}, {unique: true})
      .then(() => config.dataSource.ensureIndex(perms_table, {subject: 1}, {}))
      .then(() => config.dataSource.ensureIndex(perms_table, {resource: 1}, {}))
      .then(() => config.dataSource.ensureIndex(perms_table, {permission: 1}, {}))
      .then(() => config.dataSource.ensureIndex(roles_table, {user: 1}, {unique: true}));
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

    return config.dataSource.get(roles_table, {[F.EQUAL]: ['$user', subject]})
      .then((roles) => {
        if (roles) {
          roles.roles.forEach((r) => {
            subj.push(r);
          });
        }

        return config.dataSource.fetch(
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
   * @param {String} subjects
   * @param {String | String[]} resources
   * @returns {Promise}
   */
  this._getPermissions = function (subjects, resources, skipGlobals) {
    const r = Array.isArray(resources) ? resources.slice() : [resources];
    const returnGlobal = r.indexOf(globalMarker) >= 0;
    const subj = Array.isArray(subjects) ? subjects.slice(0) : [subjects];
    if (!skipGlobals) {
      if (r.indexOf(globalMarker) < 0) {
        r.push(globalMarker);
      }
      subj.push(globalMarker);
    }
    return config.dataSource.fetch(roles_table, {filter: {[F.IN]: ['$user', subjects]}})
      .then((users) => {
        users.forEach((u) => {
          subj.push(...u.roles);
        });
        return config.dataSource.fetch(
          perms_table,
          {
            filter: {
              [F.AND]: [
                {
                  [F.IN]: ['$subject', subj]
                },
                {
                  [F.IN]: ['$resource', r]
                }
              ]
            }
          }
        );
      })
      .then((result) => {
        const res = {};
        r.forEach((resource) => {
          res[resource] = {};
        });
        result.forEach((p) => {
          if (!(p.subject === globalMarker && skipGlobals)) {
            if (p.permission === Permissions.FULL) {
              res[p.resource][Permissions.FULL] = true;
              res[p.resource][Permissions.READ] = true;
              res[p.resource][Permissions.WRITE] = true;
              res[p.resource][Permissions.USE] = true;
              res[p.resource][Permissions.DELETE] = true;
            } else {
              res[p.resource][p.permission] = true;
            }
          }
        });

        if (!skipGlobals && res.hasOwnProperty(globalMarker)) {
          r.forEach((resource) => {
            merge(res[resource], res[globalMarker]);
          });
        }

        if (!returnGlobal) {
          delete res[globalMarker];
        }
        return res;
      });
  };

/**
 * @param {String} subject
 * @param {String | String[]} permissions
 * @returns {Promise}
 */
this._getResources = function (subject, permissions) {
  let p = Array.isArray(permissions) ? permissions.slice() : [permissions];
  if (p.indexOf(globalMarker) < 0) {
    p.push(globalMarker);
  }

  return config.dataSource.get(roles_table, {[F.EQUAL]: ['$user', subject]})
    .then((roles) => {
      let subj = [subject];
      if (roles) {
        roles.roles.forEach((r) => {
          subj.push(r);
        });
      }

      return config.dataSource.fetch(
        perms_table,
        {
          filter: {
            [F.AND]: [
              {
                [F.IN]: ['$subject', subj]
              },
              {
                [F.IN]: ['$permission', p]
              }
            ]
          },
          distinct: true,
          select: ['resource']
        }
      );
    })
    .then((res) => {
      const result = [];
      res.forEach((r) => {
        result.push(r.resource);
      });
      return result;
    });
};

/**
 * @param {String} subject
 * @returns {Promise}
 */
this._getCoactors = function (subject) {
  return config.dataSource.get(roles_table, {[F.EQUAL]: ['$user', subject]}).then(u => u ? u.roles : []);
};

}

DsAcl.prototype = new AclProvider();

module.exports = DsAcl;
