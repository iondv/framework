const request = require('request');

/**
 * @param {{}} reqParams
 * @returns {Promise.<Object>}
 */
module.exports = function requester(reqParams) {
  return new Promise((resolve, reject) => {
    request(reqParams, (err, res, body) => {
      if (err) {
        return reject(err);
      }
      return resolve(body);
    });
  });
};
