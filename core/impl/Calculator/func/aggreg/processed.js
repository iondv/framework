/**
 * Created by krasilneg on 17.07.17.
 */

const Item = require('core/interfaces/DataRepository').Item;

module.exports = function () {
  let processed = [];
  return function (v) {
    if (v instanceof Item) {
      v = v.getItemId();
    }
    if (processed.indexOf(v) < 0) {
      processed.push(v);
      return false;
    } else {
      return true;
    }
  };
};
