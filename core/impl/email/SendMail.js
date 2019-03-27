const IEmailSender = require('core/interfaces/EmailSender');
const sendmail = require('sendmail');
const merge = require('merge');

class SendMail extends IEmailSender {
  /**
   * @param {{}} options
   * @param {Logger} options.log
   * @param {{}} [options.settings]
   */
  constructor(options) {
    super();
    this.log = options.log;
    let opts = merge({silent: true}, options.settings || {});
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
   * @param {{subject: String, html: String, plain: String}} message
   * @returns {*}
   */
  _send(from, to, message) {
    let letter = {
      from: from,
      to: to,
      subject: message.subject || ''
    };
    letter.html = message.html;
    letter.text = message.plain;
    return new Promise((resolve, reject) => {
      this.sender(letter, (err, reply) => err ? reject(err) : resolve(reply));
    });
  }
}

module.exports = SendMail;

