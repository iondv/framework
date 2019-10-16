/**
 * Created by krasilneg on 25.04.17.
 */
'use strict';
const codes = require('core/errors/meta-repo');

module.exports = {
  [codes.NO_CLASS]: `Class '%class' not found.`,
  [codes.NO_ATTR]: `Attribute '%attr' not found in the '%class' class.`,
  [codes.NO_VIEW]: `View '%view' not found.`,
  [codes.NO_WORKFLOW]: `'%workflow' workflow not found.`
};
