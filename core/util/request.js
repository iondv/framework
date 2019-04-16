const request = require('request');

/**
 * @param {{}} reqParams
 * @returns {Promise.<Object>}
 */
module.exports = reqParams => new Promise(
  (resolve, reject) => {
    request(reqParams, (err, res, body) => err ? reject(err) : resolve(body));
  }
);
