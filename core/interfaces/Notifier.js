'use strict';

class Notifier {
  /**
   * @param {{}} notification
   * @param {{} | String} notification.message
   * @param {String} [notification.sender]
   * @param {String[] | String} [notification.recievers]
   * @param {String} [notification.subject]
   * @param {{}} [notification.dispatch]
   * @returns {Promise}
   */
  notify(notification) {
    return this._notify(notification);
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
   * @param {String} reciever
   * @returns {Promise}
   */
  markAllAsRead(reciever) {
    return this._markAllAsRead(reciever);
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