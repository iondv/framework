/**
 * Created by kras on 24.10.16.
 */
'use strict';

const IWorkflowProvider = require('core/interfaces/WorkflowProvider');
const checker = require('core/ConditionChecker');
const period = require('core/period');
const EventManager = require('core/impl/EventManager');
const IonError = require('core/IonError');
const Errors = require('core/errors/workflow');
const Permissions = require('core/Permissions');

const MetaPermissions  = {
  READ: 1,
  WRITE: 2,
  DELETE: 4,
  USE: 8,
  FULL: 31
};

// jshint maxcomplexity: 30, maxstatements: 60, bitwise: false
/**
 * @param {{}} options
 * @param {MetaRepository} options.metaRepo
 * @param {DataRepository} options.dataRepo
 * @param {DataSource} options.dataSource
 * @param {Logger} options.log
 * @constructor
 */
function WorkflowProvider(options) {
  var _this = this;
  EventManager.apply(this);

  var tableName = options.tableName || 'ion_wf_state';

  function addPermission(arr, flags, flag, perm) {
    if (flags & flag === flag) {
      arr[perm] = true;
    }
  }

  function addPermissions(arr, flags) {
    addPermission(arr, flags, MetaPermissions.READ, Permissions.READ);
    addPermission(arr, flags, MetaPermissions.WRITE, Permissions.WRITE);
    addPermission(arr, flags, MetaPermissions.DELETE, Permissions.DELETE);
    addPermission(arr, flags, MetaPermissions.USE, Permissions.USE);
    addPermission(arr, flags, MetaPermissions.FULL, Permissions.FULL);
  }

  /**
   * @param {Item} item
   * @returns {Promise}
   */
  this._getStatus = function (item, user) {
    return new Promise(function (resolve, reject) {
      var workflows = options.metaRepo.getWorkflows(
        item.getMetaClass().getCanonicalName(),
        item.getMetaClass().getNamespace(),
        item.getMetaClass().getVersion()
      );

      options.dataSource.fetch(tableName,
        {
          filter: {
            item: item.getClassName() + '@' + item.getItemId()
          }
        }
      ).
      then(
        function (states) {
          var result = {};

          var itemPermissions = {};
          var propertyPermissions = {};
          var selectionProviders = {};

          for (let i = 0; i < states.length; i++) {
            result[states[i].workflow] = {
              stage: states[i].stage,
              since: states[i].since,
              next: {}
            };
          }

          for (let i = 0; i < workflows.length; i++) {
            if (!result.hasOwnProperty(workflows[i].name)) {
              result[workflows[i].name] = {
                next: {}
              };
            }
            let state = result[workflows[i].name];
            state.workflowCaption = workflows[i].caption;

            let stage = workflows[i].statesByName[state.stage] || workflows[i].statesByName[workflows[i].startState];
            if (stage) {
              if (Array.isArray(stage.conditions) && stage.conditions.length) {
                if (!checker(item, stage.conditions, item)) {
                  delete result[workflows[i].name];
                  continue;
                }
              }

              state.stageCaption = stage.caption;
              state.stage = stage.name;
              if (state.since && stage.maxPeriod) {
                state.expires = period(stage.maxPeriod).addTo(state.since);
                state.expired = state.expires.getTime() < new Date().getTime();
              }

              for (let j = 0; j < stage.itemPermissions.length; j++) {
                if (item.get(stage.itemPermissions[j].role) === user) {
                  addPermissions(itemPermissions, stage.itemPermissions[j].permissions);
                }
              }

              for (let j = 0; j < stage.propertyPermissions.length; j++) {
                for (let k = 0; k < stage.propertyPermissions[j].permissions.length; k++) {
                  if (item.get(stage.propertyPermissions[j].permissions[k].role) === user) {
                    if (!propertyPermissions.hasOwnProperty(stage.propertyPermissions[j].property)) {
                      propertyPermissions[stage.propertyPermissions[j].property] = {};
                    }
                    addPermissions(
                      propertyPermissions[stage.propertyPermissions[j].property],
                      stage.propertyPermissions[j].permissions[k].permissions
                    );
                  }
                }
              }

              if (Array.isArray(workflows[i].transitionsBySrc[stage.name])) {
                for (let j = 0; j < workflows[i].transitionsBySrc[stage.name].length; j++) {
                  let transition = workflows[i].transitionsBySrc[stage.name][j];
                  if (Array.isArray(transition.conditions) && transition.conditions.length) {
                    if (!checker(item, transition.conditions, item)) {
                      continue;
                    }
                  }

                  if (Array.isArray(transition.roles) && transition.roles.length) {
                    let available = false;
                    for (let k = 0; k < transition.roles.length; k++) {
                      if (item.get(transition.roles[k]) === user) {
                        available = true;
                        break;
                      }
                    }
                    if (!available) {
                      continue;
                    }
                  }
                  state.next[transition.name] = {
                    name: transition.name,
                    caption: transition.caption,
                    signBefore: transition.signBefore,
                    signAfter: transition.signAfter
                  };
                }
              }
            } else {
              delete result[workflows[i].name];
            }
          }

          resolve({
            stages: result,
            itemPermissions: itemPermissions,
            propertyPermissions: propertyPermissions,
            selectionProviders: selectionProviders
          });
        }
      ).catch(reject);
    });
  };

  this._itemsInStatus = function (workflow, status) {
    return options.dataSource.fetch(tableName,
        {
          filter: {
            workflow: workflow,
            stage: status
          }
        }
      ).
      then(
        function (states) {
          var result = [];

          for (let i = 0; i < states.length; i++) {
            let parts = states[i].item.split('@');
            result.push({
              className: parts[0],
              id: parts[1]
            });
          }

          return Promise.resolve(result);
        }
      );
  };

  function move(item, workflow, nextState) {
    return options.dataSource.upsert(tableName,
      {
        item: item.getClassName() + '@' + item.getItemId(),
        workflow: workflow
      },
      {
        stage: nextState.name,
        since: new Date()
      }
    ).then(
      function () {
        return Promise.resolve(item);
      }
    );
  }

  function calcAssignmentValue(updates, item, assignment, options) {
    var ctx = options.env || {};
    ctx.$uid = options.uid;
    if (typeof assignment._formula === 'function') {
      ctx.$context = item;
      return Promise.resolve()
        .then(() => assignment._formula.apply(ctx))
        .then(function (v) {
          updates[assignment.key] = v;
          item.set(assignment.key, v);
          return v;
        });
    } else {
      let v = assignment.value;
      v = v && typeof v === 'string' && v[0] === '$' ?
        ctx.hasOwnProperty(v.substring(1)) ? ctx[v.substring(1)] : item.get(v.substring(1)) :
        v;
      updates[assignment.key] = v;
      item.set(assignment.key, v);
      return Promise.resolve(v);
    }
  }

  /**
   * @param {Item} item
   * @param {String} workflow
   * @param {String} name
   * @param {{}} [tOptions]
   * @param {String} [tOptions.uid]
   * @param {{}} [tOptions.env]
   * @param {ChangeLogger} [tOptions.changeLogger]
   * @returns {Promise}
   */
  this._performTransition = function (item, workflow, name, tOptions) {
    return _this._getStatus(item).then(function (status) {
        if (status.stages.hasOwnProperty(workflow)) {
          if (status.stages[workflow].next.hasOwnProperty(name)) {
            let wf = options.metaRepo.getWorkflow(
              item.getMetaClass().getName(),
              workflow,
              item.getMetaClass().getNamespace(),
              item.getMetaClass().getVersion()
            );

            if (wf) {
              if (wf.transitionsByName.hasOwnProperty(name)) {
                let transition = wf.transitionsByName[name];
                if (Array.isArray(transition.roles) && transition.roles.length) {
                  let allowed = false;
                  for (let i = 0; i < transition.roles.length; i++) {
                    if (item.get(transition.roles[i]) === tOptions.uid) {
                      allowed = true;
                      break;
                    }
                  }
                  if (!allowed) {
                    return Promise.reject(new Error('Пользователь не имеет прав на выполнение перехода.'));
                  }
                }

                let nextState = wf.statesByName[transition.finishState];
                if (!nextState) {
                  return Promise.reject(
                    new IonError(Errors.STATE_NOT_FOUND, {state: transition.finishState, workflow: wf.caption})
                  );
                }

                let updates = {};
                let calculations = null;

                if (Array.isArray(transition.assignments) && transition.assignments.length) {
                  updates = {};
                  transition.assignments.forEach((assignment) => {
                    calculations = calculations ?
                      calculations.then(() => calcAssignmentValue(updates, item, assignment, tOptions)) :
                      calcAssignmentValue(updates, item, assignment, tOptions);
                  });
                } else {
                  calculations = Promise.resolve(null);
                }

                return calculations.then(function () {
                  if (Array.isArray(nextState.conditions) && nextState.conditions.length) {
                    if (!checker(item, nextState.conditions, item)) {
                      return Promise.reject(
                        new IonError(
                          Errors.CONDITION_VIOLATION,
                          {
                            info: item.getClassName() + '@' + item.getItemId(),
                            state: nextState.caption,
                            workflow: wf.caption
                          }
                        )
                      );
                    }
                  }

                  return _this.trigger({
                    type: workflow + '.' + nextState.name,
                    item: item
                  }).then(
                    function (e) {
                      if (Array.isArray(e.results) && e.results.length) {
                        for (let i = 0; i < e.results.length; i++) {
                          if (e.results[i] && typeof e.results[i] === 'object') {
                            for (let nm in e.results[i]) {
                              if (e.results[i].hasOwnProperty(nm)) {
                                if (!updates) {
                                  updates = {};
                                }
                                updates[nm] = e.results[i][nm];
                              }
                            }
                          }
                        }
                      }

                      if (updates) {
                        return options.dataRepo.editItem(
                          item.getMetaClass().getCanonicalName(),
                          item.getItemId(),
                          updates,
                          tOptions.changeLogger,
                          {
                            uid: tOptions.uid,
                            env: tOptions.env
                          }
                        );
                      }
                      return Promise.resolve(item);
                    }
                  ).then(
                    function (item) {
                      return move(item, workflow, nextState);
                    }
                  );
                });
              }
            }
            return Promise.reject(
              new IonError(Errors.TRANS_IMPOSSIBLE, {workflow: workflow, trans: name})
            );
          }
          return Promise.reject(
            new IonError(
              Errors.NOT_IN_WORKFLOW,
              {
                workflow: workflow,
                info: item.getClassName() + '@' + item.getItemId()
              }
            )
          );
        }
      });
  };

  /**
   * @returns {Promise}
   */
  this.init = function () {
    return options.dataSource.ensureIndex(tableName, {item: 1, workflow: 1}, {unique: true})
      .then(function () { return options.dataSource.ensureIndex(tableName, {item: 1}); });
  };
}

WorkflowProvider.prototype = new IWorkflowProvider();

module.exports = WorkflowProvider;
