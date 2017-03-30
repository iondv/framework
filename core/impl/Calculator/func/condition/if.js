/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 3/30/17.
 */

const ac = require('../util').argCalcPromise;
const acSync = require('../util').argCalcSync;

function ifStatetement([expression, trueCase, falseCase]) {
  if (expression) {
    return trueCase;
  }
  return falseCase;
}

module.exports = function (args) {
  return function (sync) {
    if (sync) {
      let cArgs = acSync(this, args, 3);
      return ifStatetement(cArgs);
    } else {
      return ac(this, args, 3)
        .then(cArgs => ifStatetement(cArgs));
    }
  };
};
