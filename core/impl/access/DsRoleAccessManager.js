/**
 * Created by krasilneg on 03.12.18.
 */
/**
 * Created by krasilneg on 23.01.17.
 */
'use strict';

const RoleAccessManager = require('core/interfaces/RoleAccessManager');
const Permissions = require('core/Permissions');
const F = require('core/FunctionCodes');

/**
 * @param {{}} config
 * @param {DataSource} config.dataSource
 * @param {String} [config.allAlias]
 * @constructor
 */
function DsRoleAccessManager(config) {
  const roles_table = 'ion_acl_user_roles';

  const perms_table = 'ion_acl_permissions';

  const globalMarker = config.allAlias ? config.allAlias : '*';

  function fetchAllRoles() {
    return config.dataSource.fetch('ion_security_role', {});
  }

  function fetchAllResources(prefix) {
    const opts = {};
    if (prefix) {
      opts.filter = {[F.LIKE]: ['$id', prefix]};
    }
    return config.dataSource.fetch('ion_security_resource', opts);
  }

  this.globalMarker = function () {
    return globalMarker;
  }

  /**
   *
   * @param {String} id
   * @returns {Promise}
   */
  this._getRole = function (id) {
    return config.dataSource.get('ion_security_role', {[F.EQUAL]: ['$id', id]});
  };

  /**
   * @param {String} id
   * @returns {Promise}
   */
  this._getResource = function (id) {
    return config.dataSource.get('ion_security_resource', {[F.EQUAL]: ['$id', id]});
  };

  /**
   * @param {String} subject
   * @returns {Promise}
   */
  this._getRoles = function (subject) {
    if (!subject) {
      return fetchAllRoles();
    }
    return config.dataSource.get(roles_table, {[F.EQUAL]: ['$user', subject]}).then(u => u ? u.roles : []);
  };

  /**
   * @param {String | String[]} roles
   * @returns {Promise}
   */
  this._getSubjects = function (roles) {
    return config.dataSource
      .fetch(roles_table, {filter: {[F.IN]: ['$roles', Array.isArray(roles) ? roles : [roles]]}})
      .then(subjs => subjs.map(s => s.user));
  };

  /**
   * @param {String | String[]} roles
   * @param {String | String[]} [permissions]
   * @param {String} [prefix]
   * @returns {Promise}
   */
  this._getResources = function (roles, permissions, prefix) {
    if (!roles) {
      return fetchAllResources(prefix);
    }

    let filter = [{[F.IN]: ['$subject', Array.isArray(roles) ? roles.slice(0) : [roles]]}];
    if (prefix) {
      filter.push({[F.LIKE]: ['$resource', prefix]});
    }

    if (permissions) {
      permissions = Array.isArray(permissions) ? permissions.slice(0) : [permissions];
      if (permissions.indexOf(Permissions.FULL) < 0) {
        permissions.push(Permissions.FULL);
      }
      filter.push({[F.IN]: ['$permission', permissions]});
    }

    return config.dataSource
      .fetch(
        perms_table,
        {
          filter: {[F.AND]: filter},
          distinct: true,
          select: ['resource']
        }
      )
      .then((res) => {
        let ids = res.map(r => r.resource);
        return config.dataSource.fetch('ion_security_resource', {filter: {[F.IN]: ['$id', ids]}});
      });
  };

  /**
   * @param {String[]} subjects
   * @param {String[]} roles
   * @returns {Promise}
   */
  this._assignRoles = function (subjects, roles) {
    subjects = Array.isArray(subjects) ? subjects : [subjects];
    roles = Array.isArray(roles) ? roles : [roles];

    let p = Promise.resolve();
    subjects.forEach(
      (s) => {
        p = p
          .then(() => config.dataSource.get(roles_table, {[F.EQUAL]: ['$user', s]}))
          .then((u) => {
            const rc = roles.slice(0);
            if (u) {
              u.roles.forEach((r) => {
                if (rc.indexOf(r) < 0) {
                  rc.push(r);
                }
              });
            }
            return config.dataSource.upsert(
              roles_table,
              {[F.EQUAL]: ['$user', s]},
              {user: s, roles: rc},
              {skipResult: true}
            );
          });
      }
    );
    return p;
  };

  /**
   * @param {String[]} roles
   * @param {String[]} resources
   * @param {String[]} [permissions]
   * @returns {Promise}
   */
  this._grant = function (roles, resources, permissions) {
    roles = Array.isArray(roles) ? roles : [roles];
    if (resources) {
      resources = Array.isArray(resources) ? resources : [resources];
    } else {
      resources = [globalMarker];
    }

    if (permissions) {
      permissions = Array.isArray(permissions) ? permissions : [permissions];
    } else {
      permissions = [Permissions.FULL];
    }

    let p = Promise.resolve();

    roles.forEach((role) => {
      resources.forEach((resource) => {
        permissions.forEach((permission) => {
          p = p.then(() => config.dataSource.upsert(
            perms_table,
            {
              [F.AND]: [
                {[F.EQUAL]: ['$subject', role]},
                {[F.EQUAL]: ['$resource', resource || globalMarker]},
                {[F.EQUAL]: ['$permission', permission]}
              ]
            },
            {
              subject: role,
              resource,
              permission
            }
          ));
        });
      });
    });

    return p;
  };

  /**
   * @param {String[]} roles
   * @param {String[]} resources
   * @param {String[]} [permissions]
   * @returns {Promise}
   */
  this._deny = function (roles, resources, permissions) {
    roles = Array.isArray(roles) ? roles : [roles];

    let f = [
      {[F.IN]: ['$subject', roles]}
    ];

    if (resources) {
      resources = Array.isArray(resources) ? resources : [resources];
      f.push({[F.IN]: ['$resource', resources]});
    }

    if (permissions) {
      permissions = Array.isArray(permissions) ? permissions : [permissions];
      f.push({[F.IN]: ['$permission', permissions]});
    }

    return config.dataSource.delete(perms_table, {[F.AND]: f});
  };

  /**
   * @param {String[]} subjects
   * @param {String[]} roles
   * @returns {Promise}
   */
  this._unassignRoles = function (subjects, roles) {
    roles = Array.isArray(roles) ? roles : [roles];
    return config.dataSource.fetch(roles_table, {filter: {[F.IN]: ['$user', subjects]}})
      .then((ur) => {
        let p = Promise.resolve();
        ur.forEach((u) => {
          if (u) {
            roles.forEach((r) => {
              let ind = u.roles.indexOf(r);
              if (ind < 0) {
                u.roles.splice(ind, 1);
              }
            });
          }
          p = p.then(() => config.dataSource.update(
            roles_table,
            {[F.EQUAL]: ['$user', u.user]},
            {roles: u.roles},
            {skipResult: true}
          ));
        });
        return p;
      });
  };
  /**
   * @param {String[]} roles
   * @returns {Promise}
   */
  this._undefineRoles = function (roles) {
    roles = Array.isArray(roles) ? roles : [roles];

    return config.dataSource.delete('ion_security_role', {[F.IN]: ['$id', roles]})
      .then(() => config.dataSource.fetch(roles_table, {filter: {[F.IN]: ['$roles', roles]}}))
      .then((ur) => {
        let p = Promise.resolve();
        ur.forEach((u) => {
          roles.forEach((r) => {
            let ind = u.roles.indexOf(r);
            if (ind >= 0) {
              u.roles.splice(ind, 1);
            }
          });
          p = p.then(() => config.dataSource.update(
            roles_table,
            {[F.EQUAL]: ['$user', u.user]},
            {roles: u.roles},
            {skipResult: true}
          ));
        });
        return p;
      })
      .then(() => config.dataSource.delete(perms_table, {[F.IN]: ['$subject', roles]}));
  };

  this._defineRole = function (role, caption = null, description = null) {
    let data = {id: role};
    if (caption) {
      data.name = caption;
    }
    if (description) {
      data.description = description;
    }
    return config.dataSource.upsert('ion_security_role', {[F.EQUAL]: ['$id', role]}, data);
  };

  this._defineResource = function (resource, caption = null) {
    let data = {id: resource};
    if (caption) {
      data.name = caption;
    }
    return config.dataSource.upsert('ion_security_resource', {[F.EQUAL]: ['$id', resource]}, data);
  };

  /**
   * @param {String[]} resources
   * @returns {Promise}
   */
  this._undefineResources = function (resources) {
    return config.dataSource
      .delete('ion_security_resource', {[F.IN]: ['$id', resources]})
      .then(() => config.dataSource.delete(perms_table, {[F.IN]: ['$resource', resources]}));
  };
}

DsRoleAccessManager.prototype = new RoleAccessManager();
module.exports = DsRoleAccessManager;
