/**
 * Created by kras on 28.04.16.
 */
'use strict';

var logRecordTypes = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  PUT: 'PUT',
  EJECT: 'EJECT'
};

/**
 * @param {Date} time
 * @param {String} type
 * @param {String} className
 * @param {String} id
 * @param {String} author
 * @param {{}} updates
 * @constructor
 */
function Change(time, type, className, id, author, updates) {

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
  this.className = className;

  /**
   * @type {String}
   */
  this.id = id;

  /**
   * @type {String}
   */
  this.author = author;

  /**
   * @type {Object}
   */
  this.updates = updates;
}

/**
 * @constructor
 */
function ChangeLogger() {
  /**
   * @param {String} type
   * @param {String} objectClass
   * @param {String} objectId
   * @param {{}} updates
   * @returns {Promise}
   */
  this.LogChange = function (type, objectClass, objectId, updates) {
    if (!logRecordTypes.hasOwnProperty(type.toUpperCase())) {
      throw new Error('Неверно указан тип записи журнала изменений!');
    }
    return this._log(type.toUpperCase(), objectClass, objectId, updates);
  };

  /**
   *
   * @param {Date} since
   * @param {Date} till
   * @returns {Promise}
   */
  this.getChanges = function (since, till) {
    if (
      Object.prototype.toString.call(since) !== '[object Date]' ||
      till && Object.prototype.toString.call(till) !== '[object Date]'
    ) {
      throw new Error('Интервал должен быть задан объектами класса Date!');
    }

    if (till && since.getTime() > till.getTime()) {
      var tmp = till;
      till = since;
      since = tmp;
    }
    return this._getChanges(since, till);
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
