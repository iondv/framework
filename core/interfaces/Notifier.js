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

  /**
   * @param {String} reciever
   * @param {String} id
   * @returns {Promise}
   */
  markAsRead(reciever, id) {
    return this._markAsRead(reciever, id);
  }

  /**
   * @param {String} reciever
   * @param {{offset: Number, count: Number, new: Boolean}} options
   * @returns {Promise}
   */
  list(reciever, options) {
    return this._list(reciever, options);
  }
}

module.exports = Notifier;