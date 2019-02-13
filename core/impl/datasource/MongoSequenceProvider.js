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
      db.collection(COLLECTION, {strict: true}, (err, c) => {
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
    return collection().then((c) =>
      new Promise((resolve, reject) => {
        c.findOneAndUpdate(
          {name: name},
          {$inc: {value: 1}},
          {returnOriginal: false, upsert: true},
          (err, result) => err ? reject(err) : resolve(result.value.value)
        );
      })
    );
  };

  this._reset = function (name, value) {
    return collection().then((c) =>
      new Promise((resolve, reject) => {
        c.update(
          {name: name},
          {$set: {value: value || 0}},
          {upsert: true},
          (err) => {
            if (err) {
              return reject(err);
            }
            resolve();
          });
      })
    );
  };

  this._snapshot = function (name) {
    return collection().then((c) =>
      new Promise((resolve, reject) => {
        c.find(
          name ? {name: name} : {},
          (err, result) => {
            if (err) {
              return reject(err);
            }
            result.toArray((err, docs) => {
              if (err) {
                return reject(err);
              }
              let res = {};
              docs.forEach((o) => {
                res[o.name] = o.value;
              });
              result.close();
              resolve(res);
            });
          });
      })
    );
  };
}

MongoSequenceProvider.prototype = new SequenceProvider();

module.exports = MongoSequenceProvider;