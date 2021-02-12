const codes = require('core/errors/conditions');
const {w: t} = require('core/i18n');

module.exports = {
  [codes.NON_APPLICABLE]: t('Condition %condition is not applicable to attribute %class.%attr.'),
  [codes.ATTR_NOT_FOUND]: t('Attribute %class.%attr specified for condition is not found.'),
  [codes.INVALID_AGGREG]: t('Aggregation operation specification is invalid - class and attribute are not specified.'),
  [codes.INVALID_OPERATION]: t('Invalid operation type'),
  [codes.INVALID_CONDITION]: t('Invalid condition type'),
  [codes.NO_ARGS]: t('Operation arguments are not specified'),
};