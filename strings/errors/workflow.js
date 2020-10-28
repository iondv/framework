/**
 * Created by krasilneg on 25.04.17.
 */
'use strict';
const codes = require('core/errors/workflow');
const {t} = require('core/i18n');

module.exports = {
  [codes.ACCESS_DENIED]: t(`Access level not enough to perform workflow transition '%trans'`),
  [codes.WORKFLOW_NOT_FOUND]: t(`Workflow '%workflow' not found.`),
  [codes.TRANS_ERROR]: t(`Transition '%trans' failed.`),
  [codes.STATE_NOT_FOUND]: t(`Status '%state' of workflow '%workflow' not found.`),
  [codes.CONDITION_VIOLATION]:
  t(`Object '%info' does not satisfy conditions of final state '%state' of workflow '%workflow'.`),
  [codes.NOT_IN_WORKFLOW]: t(`Object '%info' is not in workflow '%workflow'.`),
  [codes.TRANS_IMPOSSIBLE]: t(`Transition '%trans' of workflow '%workflow' is not allowed.`),
  [codes.TRANS_NOT_FOUND]: t(`Transition '%trans' of workflow '%workflow' not found.`),
  [codes.IN_WORKFLOW]: t(`Object is already in workflow '%workflow'`)
};
