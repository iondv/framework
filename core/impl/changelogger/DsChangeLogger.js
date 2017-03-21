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
   * @param {String | {}} objectClass
   * @param {String} objectClass.name
   * @param {String} objectClass.version
   * @param {String} objectId
   * @param {Object} updates
   * @param {{}} base
   * @return {Promise}
   * @private
   */
  this._log = function (type, objectClass, objectId, updates, base) {
    var author = null;
    if (typeof authCallback === 'function') {
      author = authCallback();
    }
    return _this.ds.insert('ion_changelog', {
        timestamp: new Date(),
        type: type,
        className: typeof objectClass === 'string' ? objectClass : objectClass.name,
        classVersion: typeof objectClass === 'string' ? null : objectClass.version,
        id: objectId,
        author: author,
        base: base,
        data: updates
      }).then(function (item) {
        return Promise.resolve(
          new ChangeLogger.Change(
            item.timestamp,
            item.type,
            {
              className: item.className,
              classVersion: item.classVersion,
              id: item.id
            },
            item.author,
            item.updates,
            item.base
          )
        );
      });
  };

  /**
   * @param {String} className
   * @param {String} id
   * @param {Date} since
   * @param {Date} till
   * @return {Promise}
   * @private
   */
  this._getChanges = function (className, id, since, till) {
    var opts = {$and: [{className: className}, {id: id}]};
    if (since) {
      opts.$and.push({timestamp: {$gte: since}});
    }
    if (till) {
      opts.$and.push({timestamp: {$lt: till}});
    }
    return _this.ds.fetch('ion_changelog', {filter: opts, sort: {timestamp: 1}}).then(
      function (changes) {
        var result = [];
        for (var i = 0; i < changes.length; i++) {
          result.push(new ChangeLogger.Change(
            typeof changes[i].timestamp === 'string' ? Date.parse(changes[i].timestamp) : changes[i].timestamp,
            changes[i].type,
            {
              className: changes[i].className,
              classVersion: changes[i].classVersion,
              id: changes[i].id
            },
            changes[i].author,
            changes[i].data,
            changes[i].base
          ));
        }
        return Promise.resolve(result);
      }
    );
  };
}

// Util.inherits(DsChangeLogger, ChangeLogger);// jscs:ignore requireSpaceAfterLineComment

DsChangeLogger.prototype = new ChangeLogger();

/**
 * @type {DsChangeLogger}
 */
module.exports = DsChangeLogger;
