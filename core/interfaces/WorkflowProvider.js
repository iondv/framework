/**
 * Created by kras on 24.10.16.
 */
'use strict';

function WorkflowProvider() {
  /**
   * @param {Item} item
   * @param {{uid: User, lang: String}} options
   * @returns {Promise}
   */
  this.getStatus = function (item, options) {
    return this._getStatus(item, options || {});
  };

  /**
   * @param {String} workflow
   * @param {String} status
   * @returns {Promise}
   */
  this.itemsInStatus = function (workflow, status) {
    return this._itemsInStatus(workflow, status);
  };

  /**
   * @param {Item} item
   * @param {String} workflow
   * @param {String} name
   * @param {{}} [options]
   * @param {User} [options.user]
   * @param {ChangeLogger} [options.changeLogger]
   * @returns {Promise}
   */
  this.performTransition = function (item, workflow, name, options) {
    return this._performTransition(item, workflow, name, options || {});
  };

  /**
   * @param {Item} item
   * @param {String} workflow
   * @param {String} state
   * @param {{}} [options]
   * @param {User} [options.user]
   * @param {ChangeLogger} [options.changeLogger]
   * @returns {Promise}
   */
  this.pushToState = function (item, workflow, state, options) {
    return this._pushToState(item, workflow, state, options || {});
  };
}

module.exports = WorkflowProvider;
