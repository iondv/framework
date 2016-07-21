/**
 * Created by kras on 28.04.16.
 */
'use strict';

/* var util = require('util'); */// jscs:ignore requireCapitalizedComments

var ChangeLogger = require('core/interfaces/ChangeLogger');

/**
 * @constructor
 * @param {DataSource} ds
 */
function DsChangeLogger(ds, authCallback) {

  /**
   * @type {DataSource}
   */
  this.ds = ds;

  var _this = this;

  /**
   * @param {String} type
   * @param {String} objectClass
   * @param {String} objectId
   * @param {Object} updates
   * @return {Promise}
   * @private
   */
  this._log = function (type, objectClass, objectId, updates) {
    var author = null;
    if (typeof authCallback === 'function') {
      author = authCallback();
    }
    return new Promise(function (resolve, reject) {
      _this.ds.insert('ion_changelog', {
        timestamp: new Date().toISOString(),
        type: type,
        className: objectClass,
        id: objectId,
        author: author,
        data: updates
      }).then(function (item) {
        resolve(
          new ChangeLogger.Change(
            Date.parse(item.timestamp),
            item.type,
            item.className,
            item.id,
            item.author,
            item.updates
          )
        );
      }).catch(reject);
    });
  };

  /**
   * @param {Date} since
   * @param {Date} till
   * @return {Promise}
   * @private
   */
  this._getChanges = function (since, till) {
    return new Promise(function (resolve, reject) {
      var opts = {timestamp: {$gte: new Date(since).toISOString()}};
      if (till) {
        opts = {$and: [opts, {timestamp: {$lt: new Date(till).toISOString()}}]};
      }
      _this.ds.fetch('ion_changelog', {filter: opts, sort: {timestamp: 1}}).then(
        function (changes) {
          var result = [];
          for (var i = 0; i < changes.length; i++) {
            result.push(new ChangeLogger.Change(
              Date.parse(changes[i].timestamp),
              changes[i].type,
              changes[i].className,
              changes[i].id,
              changes[i].author,
              changes[i].data
            ));
          }
          resolve(result);
        }
      ).catch(reject);
    });
  };
}

// Util.inherits(DsChangeLogger, ChangeLogger);// jscs:ignore requireSpaceAfterLineComment

DsChangeLogger.prototype = new ChangeLogger();

/**
 * @type {DsChangeLogger}
 */
module.exports = DsChangeLogger;
