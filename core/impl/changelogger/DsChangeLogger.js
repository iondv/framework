/**
 * Created by kras on 28.04.16.
 */
'use strict';

/* var util = require('util'); */// jscs:ignore requireCapitalizedComments

const ChangeLogger = require('core/interfaces/ChangeLogger');
const F = require('core/FunctionCodes');
const User = require('core/User');

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
  this._log = (type, objectClass, objectId, updates, base) => {
    let authorIp = null;
    let author = null;
    let authorName = null;
    if (typeof authCallback === 'function') {
      author = authCallback();
      if (typeof author === 'object' && author instanceof User) {
        authorIp = author.properties().ip;
        authorName = author.name();
        author = author.id();
      }
    }
    return _this.ds.insert('ion_changelog', {
      timestamp: new Date(),
      type,
      className: typeof objectClass === 'string' ? objectClass : objectClass.name,
      classVersion: typeof objectClass === 'string' ? null : objectClass.version,
      id: objectId,
      base,
      data: updates,
      author,
      authorName,
      authorIp
    }).then(item => Promise.resolve(
      new ChangeLogger.Change(
        item.timestamp,
        item.type,
        {
          className: item.className,
          classVersion: item.classVersion,
          id: item.id
        },
        {
          id: item.author,
          name: item.authorName,
          ip: item.authorIp
        },
        item.updates,
        item.base
      ))
    );
  };

  /**
   * @param {{}} options
   * @param {String} [options.className]
   * @param {String} [options.id]
   * @param {Date} [options.since]
   * @param {Date} [options.till]
   * @param {String} [options.author]
   * @param {String} [options.authorName]
   * @param {String} [options.authorIp]
   * @param {String} [options.type]
   * @param {Number} [options.offset]
   * @param {Number} [options.count]
   * @param {Boolean} [options.total]
   * @return {Promise}
   * @private
   */
  this._getChanges = function (options) {
    let {className, id, since, till, author, authorName, authorIp, type, count, offset, total} = options;

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
    if (authorName) {
      and.push({[F.EQUAL]: ['$authorName', authorName]});
    }
    if (authorIp) {
      and.push({[F.EQUAL]: ['$authorIp', authorIp]});
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
            {
              id: changes[i].author,
              name: changes[i].authorName,
              ip: changes[i].authorIp
            },
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
