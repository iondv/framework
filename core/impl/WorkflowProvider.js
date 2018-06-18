/**
 * Created by kras on 24.10.16.
 */
'use strict';

const IWorkflowProvider = require('core/interfaces/WorkflowProvider');
const period = require('core/period');
const EventManager = require('core/impl/EventManager');
const IonError = require('core/IonError');
const Errors = require('core/errors/workflow');
const Permissions = require('core/Permissions');
const F = require('core/FunctionCodes');

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
    if ((flags & flag) === flag) {
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
   *
   * @param {Item} item
   * @param {{user: User}} options
   * @returns {{}}
   */
  function buildContext(item, options) {
    let context = {$context: item, $uid: options.user && options.user.id()};
    if (options.user) {
      let props = options.user.properties();
      for (let nm in props) {
        if (props.hasOwnProperty(nm)) {
          context[nm] = props[nm];
        }
      }
    }
    return context;
  }

  /**
   * @param {Item} item
   * @param {{user: User, lang: String}} tOptions
   * @returns {Promise}
   */
  this._getStatus = function (item, tOptions) {
    let workflows = options.metaRepo.getWorkflows(
      item.getMetaClass().getCanonicalName(),
      item.getMetaClass().getNamespace(),
      item.getMetaClass().getVersion()
    );

    let wfByName = {};
    for (let i = 0; i < workflows.length; i++) {
      wfByName[workflows[i].name] = workflows[i];
    }

    let result = {};

    let itemPermissions = {};
    let propertyPermissions = {};
    let selectionProviders = {};

    let context = buildContext(item, tOptions);

    return options.dataSource.fetch(tableName,
        {
          filter: {
            [F.EQUAL]: ['$item', item.getClassName() + '@' + item.getItemId()]
          }
        }
      )
      .then((states) => {
        for (let i = 0; i < states.length; i++) {
          if (states[i].workflow.indexOf('@') < 0 && wfByName.hasOwnProperty(states[i].workflow)) {
            states[i].workflow = states[i].workflow + '@' + wfByName[states[i].workflow].namespace;
          }
          result[states[i].workflow] = {
            stage: states[i].stage,
            since: states[i].since,
            next: {}
          };
        }

        let rp = Promise.resolve();
        workflows.forEach((wf) => {
          let fullWfName = wf.name + '@' + wf.namespace;
          if (!result.hasOwnProperty(fullWfName)) {
            result[fullWfName] = {
              next: {}
            };
          }
          let state = result[fullWfName];
          state.workflowCaption = wf.caption;

          let stage = wf.statesByName[state.stage] || wf.statesByName[wf.startState];
          if (stage) {
            if (stage._checker) {
              rp = rp.then(() => stage._checker.apply(context));
            } else {
              rp = rp.then(() => true);
            }

            rp = rp.then((allowed) => {
              if (!allowed) {
                delete result[fullWfName];
                return;
              }

              state.stageCaption = stage.caption;
              state.stage = stage.name;
              if (state.since && stage.maxPeriod) {
                state.expires = period(stage.maxPeriod).addTo(state.since);
                state.expired = state.expires.getTime() < new Date().getTime();
              }

              if (tOptions.user) {
                for (let j = 0; j < stage.itemPermissions.length; j++) {
                  if (
                    tOptions.user.isMe(stage.itemPermissions[j].role) ||
                    tOptions.user.isMe(item.get(stage.itemPermissions[j].role))
                  ) {
                    addPermissions(itemPermissions, stage.itemPermissions[j].permissions);
                  }
                }

                for (let j = 0; j < stage.propertyPermissions.length; j++) {
                  for (let k = 0; k < stage.propertyPermissions[j].permissions.length; k++) {
                    if (
                      tOptions.user.isMe(stage.propertyPermissions[j].permissions[k].role) ||
                      tOptions.user.isMe(item.get(stage.propertyPermissions[j].permissions[k].role))
                    ) {
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
              }

              let rp2 = Promise.resolve();
              if (Array.isArray(wf.transitionsBySrc[stage.name])) {
                wf.transitionsBySrc[stage.name].forEach((transition) => {
                  if (transition._checker) {
                    rp2 = rp2.then(() => transition._checker.apply(context));
                  } else {
                    rp2 = rp2.then(() => true);
                  }

                  rp2 = rp2.then((allowed) => {
                    if (allowed) {
                      if (tOptions.user && Array.isArray(transition.roles) && transition.roles.length) {
                        let available = false;
                        for (let k = 0; k < transition.roles.length; k++) {
                          if (
                            tOptions.user.isMe(transition.roles[k]) ||
                            tOptions.user.isMe(item.get(transition.roles[k]))
                          ) {
                            available = true;
                            break;
                          }
                        }
                        if (!available) {
                          return;
                        }
                      }
                      state.next[transition.name] = {
                        name: transition.name,
                        caption: transition.caption,
                        signBefore: transition.signBefore,
                        signAfter: transition.signAfter,
                        confirm: transition.confirm,
                        confirmMessage: transition.confirmMessage
                      };
                    }
                  });
                });
              }
              return rp2;
            });
          } else {
            delete result[fullWfName];
          }
        });

        return rp.then(() => {
          return {
            stages: result,
            itemPermissions: itemPermissions,
            propertyPermissions: propertyPermissions,
            selectionProviders: selectionProviders
          };
        });
      });
  };

  this._itemsInStatus = function (workflow, status) {
    return options.dataSource.fetch(tableName,
        {
          filter: {
            [F.AND]: [
              {[F.EQUAL]: ['$workflow', workflow]},
              {[F.EQUAL]: ['$stage', status]}
            ]
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
        [F.AND]: [
          {[F.EQUAL]: ['$item', item.getClassName() + '@' + item.getItemId()]},
          {[F.EQUAL]: ['$workflow', workflow]}
        ]
      },
      {
        stage: nextState.name,
        since: new Date()
      }
    ).then(() => item);
  }

  function calcAssignmentValue(updates, item, assignment, options) {
    let ctx = options.user.properties() || {};
    ctx.$uid = options.user.id();
    if (typeof assignment._formula === 'function') {
      ctx.$context = item;
      return Promise.resolve()
          .then(() => assignment._formula.apply(ctx))
          .then((v) => {
            updates[assignment.key] = v;
            item.set(assignment.key, v);
            return v;
          });
    }

    let v = assignment.value;
    v = (v && typeof v === 'string' && v[0] === '$') ?
      ctx.hasOwnProperty(v.substring(1)) ? ctx[v.substring(1)] : item.get(v.substring(1)) :
      v;
    updates[assignment.key] = v;
    item.set(assignment.key, v);
    return Promise.resolve(v);
  }

  /**
   * @param {Item} item
   * @param {String} workflow
   * @param {String} name
   * @param {{}} [tOptions]
   * @param {User} [tOptions.user]
   * @param {String} [tOptions.lang]
   * @param {ChangeLogger} [tOptions.changeLogger]
   * @returns {Promise}
   */
  this._performTransition = function (item, workflow, name, tOptions) {
    let wf = options.metaRepo.getWorkflow(
      item.getMetaClass().getCanonicalName(),
      workflow,
      item.getMetaClass().getNamespace(),
      item.getMetaClass().getVersion()
    );
    if (!wf) {
      return Promise.reject(new IonError(Errors.WORKFLOW_NOT_FOUND, {workflow: workflow}));
    }

    if (!wf.transitionsByName.hasOwnProperty(name)) {
      return Promise.reject(new IonError(Errors.TRANS_NOT_FOUND, {workflow: wf.caption, trans: name}));
    }

    let transition = wf.transitionsByName[name];

    return _this._getStatus(item, tOptions)
      .then((status) => {
        if (status.stages.hasOwnProperty(workflow)) {
          if (status.stages[workflow].next.hasOwnProperty(name)) {
            if (wf.transitionsByName.hasOwnProperty(name)) {
              if (Array.isArray(transition.roles) && transition.roles.length) {
                let allowed = false;
                for (let i = 0; i < transition.roles.length; i++) {
                  if (
                    tOptions.user.isMe(transition.roles[i]) ||
                    tOptions.user.isMe(item.get(transition.roles[i]))
                  ) {
                    allowed = true;
                    break;
                  }
                }
                if (!allowed) {
                  return Promise.reject(
                    new IonError(Errors.ACCESS_DENIED, {trans: wf.caption + '.' + transition.caption})
                  );
                }
              }

              let nextState = wf.statesByName[transition.finishState];
              if (!nextState) {
                return Promise.reject(
                  new IonError(Errors.STATE_NOT_FOUND, {state: transition.finishState, workflow: wf.caption})
                );
              }

              let updates = {};
              let calculations = Promise.resolve();

              if (Array.isArray(transition.assignments) && transition.assignments.length) {
                updates = {};
                transition.assignments.forEach((assignment) => {
                  calculations = calculations.then(() => calcAssignmentValue(updates, item, assignment, tOptions));
                });
              }

              let context = buildContext(item, tOptions);
              return calculations
                .then(() => typeof nextState._checker === 'function' ? nextState._checker.apply(context) : true)
                .then((allowed) => {
                  if (!allowed) {
                    throw new IonError(
                        Errors.CONDITION_VIOLATION,
                        {
                          info: item.getClassName() + '@' + item.getItemId(),
                          state: nextState.caption,
                          workflow: wf.caption
                        }
                      );
                  }

                  return _this.trigger({
                      user: tOptions.user || null,
                      type: workflow + '.' + nextState.name,
                      item: item
                    })
                    .then((e) => {
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
                            user: tOptions.user
                          }
                        );
                      }
                      return item;
                    })
                    .then(item => move(item, workflow, nextState));
                });
            }
          }
          return Promise.reject(
            new IonError(Errors.TRANS_IMPOSSIBLE, {workflow: wf.caption, trans: transition.caption})
          );
        }
        return Promise.reject(
          new IonError(
            Errors.NOT_IN_WORKFLOW,
            {workflow: wf.caption, info: item.getMetaClass().getCaption() + '@' + item.getItemId()}
          )
        );
      });
  };

  /**
   * @param {Item} item
   * @param {String} workflow
   * @param {String} state
   * @param {{}} [tOptions]
   * @param {User} [tOptions.user]
   * @param {String} [tOptions.lang]
   * @param {ChangeLogger} [tOptions.changeLogger]
   * @returns {Promise}
   */
  this._pushToState = function (item, workflow, state, tOptions) {
    let wf = options.metaRepo.getWorkflow(
      item.getMetaClass().getName(),
      workflow,
      item.getMetaClass().getNamespace(),
      item.getMetaClass().getVersion()
    );
    if (!wf) {
      return Promise.reject(new IonError(Errors.WORKFLOW_NOT_FOUND, {workflow: workflow}));
    }
    let context = buildContext(item, tOptions);

    if (wf.startState === state) {
      return options.dataSource.delete(tableName,
        {
          [F.AND]: [
            {[F.EQUAL]: ['$item', item.getClassName() + '@' + item.getItemId()]},
            {[F.EQUAL]: ['$workflow', workflow]}
          ]
        }
      ).then(() => item);
    }

    return _this._getStatus(item, tOptions)
      .then((status) => {
        if (status[workflow] && status[workflow].stage === state) {
          return Promise.resolve(item);
        }
        /*
        if (status.stages.hasOwnProperty(workflow)) {
          return Promise.reject(new IonError(Errors.IN_WORKFLOW, {workflow: wf.caption}));
        }
         */
        if (!wf.statesByName.hasOwnProperty(state)) {
          throw new IonError(Errors.STATE_NOT_FOUND, {state: state, workflow: wf.caption});
        }

        let target = wf.statesByName[state];
        let checker = Promise.resolve();
        checker = checker.then(() => typeof target._checker === 'function' ? target._checker.apply(context) : true);

        return checker
          .then((allowed) => {
            if (!allowed) {
              throw new IonError(
                Errors.CONDITION_VIOLATION,
                {
                  info: item.getClassName() + '@' + item.getItemId(),
                  state: target.caption,
                  workflow: wf.caption
                }
              );
            }
          })
          .then(() =>
            _this.trigger({
              user: tOptions.user || null,
              type: workflow + '.' + target.name,
              item: item
            })
          )
          .then((e) => {
              let updates;
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
                    user: tOptions.user
                  }
                );
              }
              return item;
            }
          )
          .then(item => move(item, workflow, target));
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
