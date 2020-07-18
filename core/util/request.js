const request = require('request');

/**
 * @param {{}} reqParams
 * @returns {Promise.<Object>}
 */
module.exports = reqParams => new Promise(
  (resolve, reject) => {
    request(reqParams, (err, res, body) => {
      if (err)
        return reject(err);
      if (res.statusCode !== 200)
        return reject(res);
      return resolve(body);
    });
  }
);
