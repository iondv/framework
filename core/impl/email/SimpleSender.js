const IEmailSender = require('core/interfaces/EmailSender');
const sendmail = require('sendmail');

class SimpleSender extends IEmailSender {
  /**
   * @param {{}} options
   * @param {Logger} options.log
   */
  construct(options) {
    this.log = options.log;
    let opts = {silent: false};
    if (this.log) {
      opts.logger = {
        debug: this.log.log,
        info: this.log.info,
        warn: this.log.warn,
        error: this.log.error
      };
    }
    this.sender = sendmail(opts);
  }

  /**
   * @param {String} from
   * @param {String} to
   * @param {{subject: String, body: String, type: String}} message
   * @returns {*}
   */
  _send(from, to, message) {
    let letter = {
      from: from,
      to: to,
      subject: message.subject || ''
    };
    if (message.type === 'html') {
      letter.html = message.body;
    } else {
      letter.text = message.body;
    }
    return new Promise((resolve, reject) => {
      this.sender(letter, (err, reply) => {
        if (err) {
          return reject(err);
        }
        resolve(reply);
      });
    });
  }
}

module.exports = SimpleSender;
