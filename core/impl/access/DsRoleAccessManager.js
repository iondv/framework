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
 * @param {IAccountStorage} config.accounts
 * @param {DsRoleAccessChangeLogger} config.eventLogger
 * @param {String} [config.allAlias]
 * @constructor
 */
function DsRoleAccessManager(config) {
  const roles_table = 'ion_acl_user_roles';

  const perms_table = 'ion_acl_permissions';

  const logRecordTypes = config.eventLogger.types();

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
  };

  /**
   *
   * @param {String} id
   * @returns {Promise}
   */
  this._getRole = function (id) {
    return id ? config.dataSource.get('ion_security_role', {[F.EQUAL]: ['$id', id]}) : Promise.resolve(null);
  };

  /**
   * @param {String} id
   * @returns {Promise}
   */
  this._getResource = function (id) {
    return id ? config.dataSource.get('ion_security_resource', {[F.EQUAL]: ['$id', id]}) : Promise.resolve(null);
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
    if (!roles) {
      return Promise.resolve([]);
    }
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
   * @param {User} [author]
   * @returns {Promise}
   */
  this._assignRoles = function (subjects, roles, author = null) {
    if (!subjects || !roles) {
      return Promise.resolve();
    }
    subjects = Array.isArray(subjects) ? subjects : [subjects];
    roles = Array.isArray(roles) ? roles : [roles];

    let p = Promise.resolve();
    subjects.forEach(
      (s) => {
        p = p
          .then(() => config.dataSource.get(roles_table, {[F.EQUAL]: ['$user', s]}))
          .then((u) => {
            const rc = roles.slice(0);
            let before = null;
            if (u) {
              before = u.roles;
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
            ).then((result) => {
              if (author) {
                return config.accounts.get(s, null, true)
                  .then(user => config.eventLogger.logChange(logRecordTypes.ASSIGN_ROLE, {author, user, before, updates: roles}))
                  .then(result => result);
              }
              return result;
            });
          });
      }
    );
    return p;
  };

  /**
   * @param {String[]} roles
   * @param {String[]} resources
   * @param {String[]} [permissions]
   * @param {User} [author]
   * @returns {Promise}
   */
  this._grant = function (roles, resources, permissions, author = null) {
    if (!roles) {
      return Promise.resolve();
    }
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

    let before = null;
    let p = Promise.resolve();
    if (author) {
      p = config.dataSource.fetch(perms_table, {
        filter: {[F.IN]: ['$subject', roles]}
      }).then(result => result.forEach((doc) => {
        if (!before)
          before = {};
        if (!before[doc.subject])
          before[doc.subject] = [];
        before[doc.subject].push({
          resource: doc.resource,
          permission: doc.permission
        });
      }));
    }

    roles.forEach((role) => {
      const updates = [];
      resources.forEach((resource) => {
        permissions.forEach((permission) => {
          p = p
            .then(() => this._defineResource(resource))
            .then(() => config.dataSource.upsert(
              perms_table,
              {
                [F.AND]: [
                  {[F.EQUAL]: ['$subject', role]},
                  {[F.EQUAL]: ['$resource', resource]},
                  {[F.EQUAL]: ['$permission', permission]}
                ]
              },
              {
                subject: role,
                resource,
                permission
              }
            )).then(() => updates.push({resource, permission}));
        });
      });
      p.then(() => author && config.eventLogger.logChange(logRecordTypes.GRANT, {author, role, before: before[role], updates}));
    });

    return p;
  };

  /**
   * @param {String[]} roles
   * @param {String[]} resources
   * @param {String[]} [permissions]
   * @param {User} [author]
   * @returns {Promise}
   */
  this._deny = function (roles, resources, permissions, author = null) {
    if (!roles) {
      return Promise.resolve();
    }
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

    let p = Promise.resolve();
    let before = {};
    let updates = {};
    if (author) {
      p = config.dataSource.fetch(perms_table, {filter: {[F.IN]: ['$subject', roles]}})
      .then((result) => {
        result.forEach((doc) => {
          if (!before[doc.subject])
            before[doc.subject] = [];
          before[doc.subject].push({
            resource: doc.resource,
            permission: doc.permission
          });
          if (!updates[doc.subject])
            updates[doc.subject] = [];
          if (resources && resources.includes(doc.resource) && permissions && permissions.includes(doc.permission))
            updates[doc.subject].push({
              resource: doc.resource,
              permission: doc.permission
          });
        });
      });
    }
    return p.then(() => config.dataSource.delete(perms_table, {[F.AND]: f})
      .then(() => {
        let p = Promise.resolve();
        if (author) {
          roles.forEach((role) => {
            p = p.then(() => config.eventLogger.logChange(logRecordTypes.DENY, {
              author,
              role,
              before: before[role],
              updates: updates[role]
            }));
          });
        }
        return p;
      }));
  };

  /**
   * @param {String[]} subjects
   * @param {String[]} roles
   * @param {User} [author]
   * @returns {Promise}
   */
  this._unassignRoles = function (subjects, roles, author = null) {
    if (!subjects || !roles) {
      return Promise.resolve();
    }
    roles = Array.isArray(roles) ? roles : [roles];
    return config.dataSource.fetch(roles_table, {filter: {[F.IN]: ['$user', subjects]}})
      .then((ur) => {
        let p = Promise.resolve();
        ur.forEach((u) => {
          let before = null;
          if (u) {
            before = u.roles;
            roles.forEach((r) => {
              let ind = u.roles.indexOf(r);
              if (ind >= 0) {
                u.roles.splice(ind, 1);
              }
            });
          }
          if (u.roles.length) {
            p = p.then(() => config.dataSource.update(
              roles_table,
              {[F.EQUAL]: ['$user', u.user]},
              {roles: u.roles},
              {skipResult: true}
            ));
          } else {
            p = p.then(() => config.dataSource.delete(roles_table, {[F.EQUAL]: ['$user', u.user]}));
          }
          if (author) {
            p.then(() => config.accounts.get(u.user, null, true))
              .then(user => config.eventLogger.logChange(logRecordTypes.UNASSIGN_ROLE, {author, user, before, updates: roles}));
          }
        });
        return p;
      });
  };

  /**
   * @param {String[]} roles
   * @param {User} [author]
   * @returns {Promise}
   */
  this._undefineRoles = function (roles, author = null) {
    if (!roles) {
      return Promise.resolve();
    }
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
      .then(() => config.dataSource.delete(perms_table, {[F.IN]: ['$subject', roles]}))
      .then(() => {
        let p = Promise.resolve();
        if (author) {
          roles.forEach((role) => {
            p = p.then(() => config.eventLogger.logChange(logRecordTypes.UNDEFINE_ROLE, {author, role}));
          });
        }
        return p;
      });
  };

  this._defineRole = function (role, caption = null, description = null, author = null) {
    if (!role) {
      return Promise.resolve();
    }
    let data = {id: role};
    if (caption) {
      data.name = caption;
    }
    if (description) {
      data.description = description;
    }
    return config.dataSource.upsert('ion_security_role', {[F.EQUAL]: ['$id', role]}, data)
      .then(() => author && config.eventLogger.logChange(logRecordTypes.DEFINE_ROLE, {author, role, updates: data}));
  };

  this._defineResource = function (resource, caption = null) {
    if (!resource) {
      return Promise.resolve();
    }
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
    if (!resources) {
      return Promise.resolve();
    }
    return config.dataSource
      .delete('ion_security_resource', {[F.IN]: ['$id', resources]})
      .then(() => config.dataSource.delete(perms_table, {[F.IN]: ['$resource', resources]}));
  };
}

DsRoleAccessManager.prototype = new RoleAccessManager();
module.exports = DsRoleAccessManager;
