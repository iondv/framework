/**
 * Created by krasilneg on 27.03.19.
 */
const IEmailSender = require('core/interfaces/EmailSender');
const nodemailer = require('nodemailer');

class NodeMailer extends IEmailSender {
  /**
   * @param {{}} options
   * @param {{}} options.transport
   */
  constructor(options) {
    super();
    this.transport = nodemailer.createTransport(options.transport);
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
    return this.transport.sendMail(letter);
  }
}

module.exports = NodeMailer;
