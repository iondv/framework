/**
 * Created by kras on 24.10.16.
 */
'use strict';

function WorkflowProvider() {
  /**
   * @param {Item} item
   * @returns {Promise}
   */
  this.getStatus = function (item) {
    return this._getStatus(item);
  };

  /**
   * @param {Item} item
   * @param {String} workflow
   * @param {String} name
   * @param {String} user
   * @param {{}} [options]
   * @param {ChangeLogger} [options.changeLogger]
   * @returns {Promise}
   */
  this.performTransition = function (item, workflow, name, user, options) {
    return this._performTransition(item, workflow, name, user, options || {});
  };
}

module.exports = WorkflowProvider;
