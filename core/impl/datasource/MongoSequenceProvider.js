'use strict';
const SequenceProvider = require('core/interfaces/SequenceProvider');

/**
 * @param {{}} options
 * @param {MongoDs} options.dataSource
 * @param {String} [collectionName]
 * @constructor
 */
function MongoSequenceProvider(options) {
  var COLLECTION = options.collectionName || 'ion_sequences';

  function collection() {
    /**
     * @type {Db}
     */
    let db = options.dataSource.connection();
    return new Promise((resolve, reject) => {
      db.collection(COLLECTION, {strict: true}, function (err, c) {
        if (!c) {
          try {
            db.createCollection(COLLECTION)
              .then(resolve)
              .catch(e => reject(e));
          } catch (e) {
            return reject(e);
          }
        } else {
          if (err) {
            return reject(err);
          }
          resolve(c);
        }
      });
    });
  }

  this._next = function (name) {
    return collection().then((c) => {
      return new Promise((resolve, reject) => {
        c.findOneAndUpdate(
          {name: name},
          {$inc: {value: 1}},
          {returnOriginal: false, upsert: true},
          function (err, result) {
            if (err) {
              return reject(err);
            }
            resolve(result.value.value);
          });
      });
    });
  };

  this._reset = function (name) {
    return collection().then((c) => {
      return new Promise((resolve, reject) => {
        c.update(
          {name: name},
          {value: 0},
          {upsert: true},
          function (err, result) {
            if (err) {
              return reject(err);
            }
            resolve();
          });
      });
    });
  };
}

MongoSequenceProvider.prototype = new SequenceProvider();

module.exports = MongoSequenceProvider;