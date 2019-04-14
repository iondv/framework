class EmailSender {
  /**
   * @param {String} from
   * @param {String | String[]} to
   * @param {{subject: String, body: String, type: String}} message
   * @returns {Promise}
   */
  send(from, to, message) {
    return this._send(from, to, message);
  }
}

module.exports = EmailSender;
