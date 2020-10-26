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
  this.s = function(prefix, id, params) {
    if (prefix && id) {
      if (this.base.hasOwnProperty(prefix) && this.base[prefix].hasOwnProperty(id)) {
        var str = this.base[prefix][id];
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
window.s = window.i18n.s.bind(window.i18n);
window.i18n.base = ${JSON.stringify(base(user.language()))};      
      `));
  } catch (err) {
    scope.logRecorder.stop();
    onError(scope, err, res, true);
  }
},
res);
