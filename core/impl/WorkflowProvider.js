/**
 * Created by kras on 24.10.16.
 */
'use strict';

const IWorkflowProvider = require('core/interfaces/WorkflowProvider');
const checker = require('core/ConditionChecker');
const period = require('core/period');
const EventManager = require('core/impl/EventManager');
const Permissions = require('core/Permissions');

const MetaPermissions  = {
  READ: 1,
  WRITE: 2,
  DELETE: 4,
  USE: 8,
  FULL: 31
};

// jshint maxcomplexity: 20, maxstatements: 50, bitwise: false
/**
 * @param {{}} options
 * @param {MetaRepository} options.metaRepo
 * @param {DataRepository} options.dataRepo
 * @param {DataSource} options.dataSource
 * @constructor
 */
function WorkflowProvider(options) {
  var _this = this;
  EventManager.apply(this);

  var tableName = options.tableName || 'ion_wf_state';

  /**
   * @param {Item} item
   * @returns {Promise}
   */
  this._getStatus = function (item, user) {
    return new Promise(function (resolve, reject) {
      var workflows = options.metaRepo.getWorkflows(
        item.getMetaClass().getName(),
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
                if (!itemPermissions.hasOwnProperty(stage.itemPermissions[j].role)) {
                  itemPermissions[stage.itemPermissions[j].role] = 0;
                }
                itemPermissions[stage.itemPermissions[j].role] |= stage.itemPermissions[j].permissions;
              }

              for (let j = 0; j < stage.propertyPermissions.length; j++) {
                if (!propertyPermissions.hasOwnProperty(stage.propertyPermissions[j].property)) {
                  propertyPermissions[stage.propertyPermissions[j].property] = {};
                }
                for (let k = 0; k < stage.propertyPermissions[j].permissions.length; k++) {
                  if (!propertyPermissions[stage.propertyPermissions[j].property].
                    hasOwnProperty(stage.propertyPermissions[j].permissions[k].role)) {
                    propertyPermissions
                      [stage.propertyPermissions[j].property]
                      [stage.propertyPermissions[j].permissions[k].role] = 0;
                  }

                  propertyPermissions
                    [stage.propertyPermissions[j].property]
                    [stage.propertyPermissions[j].permissions[k].role] |=
                    stage.propertyPermissions[j].permissions[k].permissions;
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

  function calcAssignmentValue(updates, item, key, formula) {
    return Promise.resolve()
      .then(() => formula.apply(item, [{}]))
      .then(function (v) {
        updates[key] = v;
        item.set(key, v);
        return v;
      });
  }

  /**
   * @param {Item} item
   * @param {String} workflow
   * @param {String} name
   * @param {String} user
   * @returns {Promise}
   */
  this._performTransition = function (item, workflow, name, user) {
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
                    if (item.get(transition.roles[i]) === user) {
                      allowed = true;
                      break;
                    }
                  }
                  if (!allowed) {
                    return Promise.reject(new Error('Пользователь не имеет прав на выполнение перехода.'));
                  }
                }

                var nextState = wf.statesByName[transition.finishState];
                if (!nextState) {
                  return Promise.reject(new Error('Не найдено конечное состояние перехода.'));
                }

                var updates = {};
                var calculations = [];

                if (Array.isArray(transition.assignments) && transition.assignments.length) {
                  updates = {};
                  for (let i = 0; i < transition.assignments.length; i++) {
                    if (transition.assignments[i]._formula) {
                      calculations.push(
                        calcAssignmentValue(
                          updates,
                          item,
                          transition.assignments[i].key,
                          transition.assignments[i]._formula
                        )
                      );
                    } else {
                      let v = transition.assignments[i].value;
                      v = v && typeof v === 'string' && v[0] === '$' ? item.get(v.substring(1)) : v;
                      updates[transition.assignments[i].key] = v;
                      item.set(transition.assignments[i].key, v);
                    }
                  }
                }

                return Promise.all(calculations).then(function () {
                  if (Array.isArray(nextState.conditions) && nextState.conditions.length) {
                    if (!checker(item, nextState.conditions, item)) {
                      return Promise.reject(
                        new Error('Объект не удовлетворяет условиям конечного состояния перехода.')
                      );
                    }
                  }

                  return _this.trigger({
                    type: workflow + '.' + nextState.name,
                    item: item
                  }).then(
                    function (e) {
                      if (Array.isArray(e.results) && e.results.length) {
                        for (var i = 0; i < e.results.length; i++) {
                          for (var nm in e.results[i]) {
                            if (e.results[i].hasOwnProperty(nm)) {
                              if (!updates) {
                                updates = {};
                              }
                              updates[nm] = e.results[i][nm];
                            }
                          }
                        }
                      }

                      if (updates) {
                        return options.dataRepo.editItem(
                          item.getMetaClass().getCanonicalName(),
                          item.getItemId(),
                          updates,
                          null,
                          {uid: user}
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
            return Promise.reject(new Error('Невозможно выполнить переход ' + name + ' рабочего процесса ' + workflow));
          }
          return Promise.reject(new Error('Объект не участвует в рабочем процессе ' + workflow));
        }
      });
  };

  /**
   * @returns {Promise}
   */
  this.init = function () {
    return new Promise(function (resolve, reject) {
      options.dataSource.ensureIndex(tableName, {item: 1, workflow: 1}, {unique: true})
        .then(function () { return options.dataSource.ensureIndex(tableName, {item: 1}); })
        .then(function () {resolve();})
        .catch(reject);
    });
  };
}

WorkflowProvider.prototype = new IWorkflowProvider();

module.exports = WorkflowProvider;
