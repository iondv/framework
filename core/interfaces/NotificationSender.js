class NotificationSender {
  /**
   * @param {User} sender
   * @param {User[]} recievers
   * @param {{subject: String, message: String}} notification
   * @returns {*}
   */
  send(sender, recievers, notification) {
    return this._send(sender, recievers, notification);
  }
}

module.exports = NotificationSender;
