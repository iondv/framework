const session = require('express-session');
const dbc = require('connect-mongo');

/**
 * @param {{}} options
 * @param {DataSource} options.dataSource
 * @constructor
 */
function MongoSessionStorage(options) {

  let connecting = false;
  let smw = null;
  let _db = null;

  /**
   * @param {{}} sessOpts
   * @returns {Promise}
   */
  this.getMiddleware = function (sessOpts) {
    return new Promise((resolve, reject) => {
      let db = options.dataSource.connection();
      if (db && db === _db && smw) {
        return resolve(smw);
      }
      if (connecting) {
        return reject(new Error('Не удалось инициализировать хранилище сессий.'));
      }
      smw = null;
      connecting = true;
      options.dataSource.open()
        .then((db) => {
          _db = db;
          connecting = false;
          let MongoStore = dbc(session);
          sessOpts.store = new MongoStore({db: db, ttl: 14 * 24 * 60 * 60});
          smw = session(sessOpts);
          return resolve(smw);
        })
        .catch((err) => {
          connecting = false;
          reject(err);
        });
    });
  };

}

module.exports = MongoSessionStorage;
