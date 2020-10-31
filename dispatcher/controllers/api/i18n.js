const onError = require('../../../backend/error');
const respond = require('../../../backend/respond');
const strings = require('core/strings');

module.exports = (req, res) => respond(['auth'], (scope) => {
  try {
    const user = scope.auth.getUser(req);
    let base = strings.getBase('frontend');

    res
      .set('Content-type', 'application/javascript')
      .send(Buffer.from(`
'use strict';

function I18nHandler() {
  this.base = {};
  this.s = function(id, params) {
    if (id) {
      if (this.base.hasOwnProperty(id)) {
        var str = this.base[id];
        if (params) {
          for (var p in params) {
            str = str.replace('%' + p, params[p]);
          }
        }
        return str;
      }
      return id;
    }
    return '';
  };
}

window.i18n = new I18nHandler();
window.s = window.__ = function (id, params) {return window.i18n.s(id, params);};
window.i18n.base = ${JSON.stringify(base(user.language()))};      
      `));
  } catch (err) {
    if (scope.logRecorder) {
      scope.logRecorder.stop();
    }
    onError(scope, err, res, true);
  }
},
res);
