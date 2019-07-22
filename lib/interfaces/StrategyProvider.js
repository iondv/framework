/**
 * Created by krasilneg on 05.04.19.
 */

function StrategyProvider() {
  this.getStrategy = function (conf, verify) {
    return this._getStrategy(conf, verify);
  };
}

module.exports = StrategyProvider;