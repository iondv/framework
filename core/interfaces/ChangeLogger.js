/**
 * Created by kras on 28.04.16.
 */
'use strict';
const {t} = require('core/i18n');

const logRecordTypes = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  PUT: 'PUT',
  EJECT: 'EJECT'
};

// jshint maxparams: 10

/**
 * @param {Date} time
 * @param {String} type
 * @param {{}} obj
 * @param {String} obj.className
 * @param {String} obj.classVersion
 * @param {String} obj.id
 * @param {String} author.id
 * @param {String} author.name
 * @param {String} author.ip
 * @param {{}} updates
 * @param {{}} base
 * @constructor
 */
function Change(time, type, obj, author, updates, base) {

  /**
   * @type {Date}
   */
  this.time = time;

  /**
   * @type {String}
   */
  this.type = type;

  /**
   * @type {String}
   */
  this.className = obj.className;

  /**
   * @type {String}
   */
  this.classVersion = obj.classVersion;

  /**
   * @type {String}
   */
  this.id = obj.id;

  /**
   * @type {String}
   */
  this.author = author.id;

  /**
   * @type {String}
   */
  this.authorName = author.name;

  /**
   * @type {String}
   */
  this.authorIp = author.ip;

  /**
   * @type {Object}
   */
  this.updates = updates;

  /**
   * @type {{}}
   */
  this.base = base;
}

/**
 * @constructor
 */
function ChangeLogger() {
  /**
   * @param {String} type
   * @param {{} | String} objectClass
   * @param {String} objectClass.name
   * @param {String} objectClass.version
   * @param {String} objectId
   * @param {{}} updates
   * @param {{}} [base]
   * @returns {Promise}
   */
  this.logChange = function (type, objectClass, objectId, updates, base) {
    if (!logRecordTypes.hasOwnProperty(type.toUpperCase())) {
      throw new Error(t('Invalid changelog journal record type specified!'));
    }
    return this._log(type.toUpperCase(), objectClass, objectId, updates, base || {});
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
   * @returns {Promise}
   */
  this.getChanges = function (options) {
    let {className, id, since, till, author, type} = options;
    if (!(className || id || since || till || author || type)) {
      throw new Error(t('Changelog record fetch criteria not specified'));
    }

    if (
      since && !(since instanceof Date) ||
      till && !(till instanceof Date)
    ) {
      throw new Error(t('Interval should be specified as Date instance!'));
    }

    if (since && till && since.getTime() > till.getTime()) {
      let tmp = till;
      till = since;
      since = tmp;
    }
    return this._getChanges(options);
  };
}

/**
 * @type {ChangeLogger}
 */
module.exports = ChangeLogger;

/**
 * @type {{CREATE: String, UPDATE: String, DELETE: String, PUT: String, EJECT: String}}
 */
module.exports.EventType = logRecordTypes;

/**
 * @type {Change}
 */
module.exports.Change = Change;
