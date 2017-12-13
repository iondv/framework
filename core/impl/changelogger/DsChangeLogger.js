/**
 * Created by kras on 28.04.16.
 */
'use strict';

/* var util = require('util'); */// jscs:ignore requireCapitalizedComments

const ChangeLogger = require('core/interfaces/ChangeLogger');
const F = require('core/FunctionCodes');

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
   * @param {{}} options
   * @param {String} [options.className]
   * @param {String} [options.id]
   * @param {Date} [options.since]
   * @param {Date} [options.till]
   * @param {String} [options.author]
   * @param {String} [options.type]
   * @param {Number} [options.offset]
   * @param {Number} [options.count]
   * @param {Boolean} [options.total]
   * @return {Promise}
   * @private
   */
  this._getChanges = function (options) {
    let {className, id, since, till, author, type, count, offset, total} = options;

    let qoptions = {
      sort: {timestamp: 1},
      offset: offset,
      countTotal: total
    };
    let and = [];
    if (className) {
      and.push({[F.EQUAL]: ['$className', className]});
    }
    if (id) {
      and.push({[F.EQUAL]: ['$id', id]});
    }
    if (since) {
      and.push({[F.GREATER_OR_EQUAL]: ['$timestamp', since]});
    }
    if (till) {
      and.push({[F.LESS]: ['$timestamp', till]});
    }
    if (author) {
      and.push({[F.EQUAL]: ['$author', author]});
    }
    if (type) {
      and.push({[F.EQUAL]: ['$type', type]});
    }

    qoptions.filter = {[F.AND]: and};
    if (count) {
      qoptions.count = count;
    }

    return _this.ds.fetch('ion_changelog', qoptions)
      .then((changes) => {
        let result = [];
        for (let i = 0; i < changes.length; i++) {
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
        if (changes.total) {
          result.total = changes.total;
        }
        return Promise.resolve(result);
      }
    );
  };
}

DsChangeLogger.prototype = new ChangeLogger();

/**
 * @type {DsChangeLogger}
 */
module.exports = DsChangeLogger;
