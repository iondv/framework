/**
 * Created by krasilneg on 25.04.17.
 */
'use strict';
const codes = require('core/errors/meta-repo');
const {w: t} = require('core/i18n');

module.exports = {
  [codes.NO_CLASS]: t('Class %class not found in namespace %namespace.'),
  [codes.NO_ATTR]: t('Attribute \'%attr\' not found in class \'%class\'.'),
  [codes.NO_VIEW]: t('View \'%view\' not found.'),
  [codes.NO_WORKFLOW]: t('Workflow \'%workflow\' not found.')
};
