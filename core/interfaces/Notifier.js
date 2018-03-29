'use strict';

class Notifier {
  /**
   * @param {String} sender
   * @param {String[]} recievers
   * @param {String} message
   * @returns {Promise}
   */
  notify(sender, recievers, message) {
    return this._notify(sender, recievers, message);
  }

  withdraw(id) {
    return this._withdraw(id);
  }

  /**
   * @param {String} reciever
   * @param {String} id
   * @returns {Promise}
   */
  markAsRead(reciever, id) {
    return this._markAsRead(reciever, id);
  }

  /**
   * @param {String} id
   * @returns {Promise}
   */
  get(id) {
    return this._get(id);
  }

  /**
   * @param {String} reciever
   * @param {{offset: Number, count: Number, new: Boolean, since: Date}} options
   * @returns {Promise}
   */
  list(reciever, options) {
    return this._list(reciever, options);
  }
}

module.exports = Notifier;