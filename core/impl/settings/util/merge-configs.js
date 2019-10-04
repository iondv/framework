/**
 * Created by krasilneg on 25.04.19.
 */

function array_unique(arr) {
  let tmp = [];
  return arr.filter(
    (e) => {
      let se = typeof e === 'object' ? JSON.stringify(e) : e;
      if (tmp.indexOf(se) >= 0) {
        return false;
      }
      tmp.push(se);
      return true;
    }
  );
}

/**
 * @param {*} old
 * @param {*} val
 * @param {{}} [options]
 * @param {Boolean} [options.overrideArrays]
 * @returns {*}
 */
function smartMerge(old, val, options) {
  if (typeof old === typeof val) {
    if (old && typeof old === 'object') {
      if (Array.isArray(old)) {
        if (options && options.overrideArrays) {
          return val;
        }

        if (Array.isArray(val)) {
          for (let i = 0; i < val.length; i++) {
            if (old.indexOf(val[i]) < 0) {
              old.push(val[i]);
            }
          }
        } else {
          old.push(val);
        }
        let tmp = array_unique(old);
        old.splice(0, old.length);
        old.push(...tmp);
      } else {
        for (let nm in val) {
          if (val.hasOwnProperty(nm)) {
            old[nm] = smartMerge(old.hasOwnProperty(nm) ? old[nm] : undefined, val[nm], options);
          }
        }
      }
      return old;
    }
  }
  return val;
}

module.exports = smartMerge;
