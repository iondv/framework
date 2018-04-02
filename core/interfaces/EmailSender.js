class EmailSender {
  /**
   * @param {String} from
   * @param {String} to
   * @param {{subject: String, body: String, type: String}} message
   * @returns {*}
   */
  send(from, to, message) {
    return this._send(from, to, message);
  }
}

module.exports = EmailSender;
