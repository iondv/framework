/**
 * Created by krasilneg on 25.04.17.
 */
const codes = require('core/errors/data-repo');

module.exports = {
  [codes.ITEM_EXISTS]: `%class with this attribute '%attr'already exists.`,
  [codes.ITEM_EXISTS_MULTI]: `%class with sch attributes '%attr' already exists.`,
  [codes.ITEM_NOT_FOUND]: `Object '%info' not found.`,
  [codes.EXISTS_IN_COL]: `Object '%info' already present in collection '%col'.`,
  [codes.BAD_PARAMS]: `Invalid parameters passed to '%method' method.`,
  [codes.FILE_ATTR_SAVE]: `Failed to save data to file attribute '%attr' of object '%info'.`,
  [codes.FILE_ATTR_LOAD]: `Could not load file attribute '%attr'.`,
  [codes.NO_COLLECTION]: `In the %info object '%attr' collection is missing.`,
  [codes.INVALID_META]: `Error in metadata object class '%info'.`,
  [codes.COMPOSITE_KEY]: `Using composite keys in the '%oper' operation is not supported.`,
  [codes.FAIL]: `Action '%operation' was not performed for the object '%info'.`,
  [codes.MISSING_REQUIRED]: `Required attributes are not filled in %info.`,
  [codes.NO_KEY_SPEC]: `The value of the key attribute %info is not specified.`,
  [codes.NO_BACK_REF]: `%backAttr attribute not found by back reference %backRef.`,
  [codes.UNEXPECTED_ASYNC]: `When calculating the default value of the %info attribute, an asynchronous operation was performed.`,
  [codes.PERMISSION_LACK]: `Insufficient rights to perform an action`
};
