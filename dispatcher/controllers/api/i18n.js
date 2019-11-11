const onError = require('../../../backend/error');
const respond = require('../../../backend/respond');
const strings = require('core/strings');

module.exports = (req, res) => respond(['auth'], (scope) => {
  try {
    const user = scope.auth.getUser(req);
    res.send(strings.getBase('frontend', user.language()) || {});
  } catch (err) {
    scope.logRecorder.stop();
    onError(scope, err, res, true);
  }
},
res);
