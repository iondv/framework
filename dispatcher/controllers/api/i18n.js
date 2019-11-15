const onError = require('../../../backend/error');
const respond = require('../../../backend/respond');
const strings = require('core/strings');

module.exports = (req, res) => respond(['auth'], (scope) => {
  try {
    const user = scope.auth.getUser(req);
    let base = strings.getBase(null, user.language());
    if (!base || !Object.keys(base).length) {
      base = strings.getBase();
    }
    res
      .set('Content-type', 'application/javascript')
      .render('i18n-handler', {base});
  } catch (err) {
    scope.logRecorder.stop();
    onError(scope, err, res, true);
  }
},
res);
