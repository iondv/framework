/**
 * Created by kras on 04.09.16.
 */
// jshint eqeqeq: false
module.exports = function (checkedValue, metaValue) {
  if (checkedValue instanceof Date) {
    return checkedValue == metaValue ||
      checkedValue.getTime() == metaValue ||
      checkedValue.toString() == metaValue ||
      checkedValue.toDateString() === metaValue ||
      checkedValue.toJSON() === metaValue ||
      checkedValue.toISOString() === metaValue;
  }
  if (typeof checkedValue === 'boolean') {
    return checkedValue ? metaValue && metaValue != 'false' : metaValue == 'false' || !metaValue;
  }
  return checkedValue == metaValue;
}
