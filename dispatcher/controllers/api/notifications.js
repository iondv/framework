/**
 * Created by kras on 06.02.18.
 */
'use strict';

const onError = require('../../../backend/error');
const respond = require('../../../backend/respond');

// jshint maxstatements: 40, maxcomplexity: 20, maxdepth: 20, loopfunc: true


module.exports = function (req, res) {
  respond(['auth', 'notifier'],
    /**
     * @param {{notifier: Notifier, auth: Auth}} scope
     * @param {AccessChecker} scope.accessChecker
     */
    function (scope) {
      try {
        let user = scope.auth.getUser(req);
        let opts = {count: 100, new: true};
        if (req.query.incremental) {
          opts.since = req.session.lnr;
          req.session.lnr = new Date();
        }
        scope.notifier.list(user.id(), opts)
          .then((result) => {
            res.send(result);
          })
          .catch((err) => {
            onError(scope, err, res, true);
          });
      } catch (err) {
        scope.logRecorder.stop();
        onError(scope, err, res, true);
      }
    },
    res
  );
};
