const INotificationSender = require('core/interfaces/NotificationSender');
const resolvePath = require('core/resolvePath');
const ejs = require('ejs');
const path = require('path');

class EmailNotifier extends INotificationSender {
  /**
   * @param {{}} options
   * @param {EmailSender} options.sender
   * @param {String} [options.tplDir]
   * @param {Logger} options.log
   * @param {{}} [options.templates]
   */
  constructor(options) {
    super();
    this.sender = options.sender;
    this.tplDir = options.tplDir ? resolvePath(options.tplDir) : null;
    this.log = options.log;
    this.templates = options.templates;
  }

  /**
   * @param {User} sender
   * @param {User[]} recievers
   * @param {{subject: String, message: String, type: String, options: {}}} notification
   * @returns {*}
   */
  _send(sender, recievers, notification) {
    let tpl = this.tplDir && this.templates && this.templates[notification.type];
    let plainTpl = false;
    let htmlTpl = false;
    if (tpl) {
      if (typeof tpl === 'string') {
        htmlTpl = tpl;
      } else if (typeof tpl === 'object') {
        htmlTpl = tpl.html;
        plainTpl = tpl.plain;
      }
    }

    const preprocess = (reciever, tpl) => {
      if (!tpl) {
        return Promise.resolve(String(notification.message));
      }
      return new Promise((resolve, reject) => {
        ejs.renderFile(
          tpl,
          {
            subject: notification.subject,
            message: notification.message,
            sender: sender,
            reciever: reciever
          },
          {},
          (err, content) => err ? reject(err) : resolve(content)
        );
      });

    };
    let p = Promise.resolve();
    recievers.forEach((reciever) => {
      if (reciever.email()) {
        let plain;
        p = p
          .then(() => preprocess(reciever, plainTpl))
          .then((msg) => {
            plain = msg;
            return preprocess(reciever, htmlTpl);
          })
          .then(html =>
            this.sender.send(
              sender && sender.email(),
              reciever.email(),
              {
                subject: notification.subject,
                html: html,
                plain: plain
              }
            )
          )
          .catch((err) => {
            if (this.log) {
              this.log.warn('Не удалось отправить оповещение на электронную почту' + reciever.email());
              this.log.error(err);
            }
          });
      }
    });
    return p;
  }
}

module.exports = EmailNotifier;