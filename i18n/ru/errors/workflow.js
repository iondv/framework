/**
 * Created by krasilneg on 25.04.17.
 */
'use strict';
const codes = require('core/errors/workflow');

module.exports = {
  [codes.ACCESS_DENIED]: `Insufficient rights to perform workflow transition '%trans'`,
  [codes.WORKFLOW_NOT_FOUND]: `'%workflow' workflow not found.`,
  [codes.TRANS_ERROR]: `Error while executing workflow transition '%trans'.`,
  [codes.STATE_NOT_FOUND]: `Condition not found '%state' of the '%workflow' workflow.`,
  [codes.CONDITION_VIOLATION]:
    `Object '%info' does not meet the conditions of the final state '%state' of the '%workflow' workflow.`,
  [codes.NOT_IN_WORKFLOW]: `Object '%info' is not in the '%workflow' workflow.`,
  [codes.TRANS_IMPOSSIBLE]: `Unable to complete transition '%trans' work-flow '%workflow'.`,
  [codes.TRANS_NOT_FOUND]: `Transition not found '%trans' work-flow '%workflow'.`,
  [codes.IN_WORKFLOW]: `Object is already in workflow '%workflow'`
};
