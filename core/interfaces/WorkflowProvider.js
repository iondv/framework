/**
 * Created by kras on 24.10.16.
 */
'use strict';

function WorkflowProvider() {
  /**
   * @param {Item} item
   * @returns {Promise}
   */
  this.getStatus = function (item, user) {
    return this._getStatus(item, user);
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
   * @param {String} [options.uid]
   * @param {{}} [options.env]
   * @param {ChangeLogger} [options.changeLogger]
   * @returns {Promise}
   */
  this.performTransition = function (item, workflow, name, options) {
    return this._performTransition(item, workflow, name, options || {});
  };
}

module.exports = WorkflowProvider;
