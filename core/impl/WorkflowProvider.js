/**
 * Created by kras on 24.10.16.
 */
'use strict';

const IWorkflowProvider = require('core/interfaces/WorkflowProvider');

/**
 * @param {{}} options
 * @param {MetaRepository} options.metaRepo
 * @param {DataSource} options.dataSource
 * @constructor
 */
function WorkflowProvider(options) {

  var tableName = options.tableName || 'ion_wf_state';

  /**
   * @param {Item} item
   * @returns {Promise}
   */
  this._getStatus = function (item) {
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
      then(function (states) {
        
      }).catch(reject);
    });
  };

  /**
   * @param {Item} item
   * @param {String} workflow
   * @param {String} name
   * @returns {Promise}
   */
  this._performTransition = function (item, workflow, name) {
    return new Promise(function (resolve, reject) {

    });
  };
}

WorkflowProvider.prototype = new IWorkflowProvider();

module.exports = WorkflowProvider;
