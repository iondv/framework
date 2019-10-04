/**
 * Created by krasilneg on 10.01.19.
 */

module.exports = function (col, cond, cb) {
  let p = Promise.resolve();
  col.forEach((item) => {
    p = p.then(() => cond.apply(item)).then(apply => apply ? cb(item) : null);
  });
  return p;
}