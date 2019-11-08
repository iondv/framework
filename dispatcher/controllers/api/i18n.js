const onError = require('../../../backend/error');
const respond = require('../../../backend/respond');
const strings = require('core/strings');

module.exports = (req, res) => respond([], (scope) => {
  try {
    res.send(strings.getBase(req.query.prefix, req.query.lang) || {});
  } catch (err) {
    scope.logRecorder.stop();
    onError(scope, err, res, true);
  }
},
res);
