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
   * @param {String} [options.defaultSenderEmail]
   */
  constructor(options) {
    super();
    this.sender = options.sender;
    this.tplDir = options.tplDir ? resolvePath(options.tplDir) : null;
    this.log = options.log;
    this.templates = options.templates;
    this.defaultSenderEmail = options.defaultSenderEmail;
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
          path.join(this.tplDir, tpl),
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
    if (notification.options && !notification.options.individual) {
      const rcvrs = [];
      recievers.forEach((reciever) => {
        if (reciever.email()) {
          rcvrs.push(reciever.email());
        }
      });
      if (rcvrs.length) {
        let plain;
        p = p
          .then(() => preprocess(null, plainTpl))
          .then((msg) => {
            plain = msg;
            return preprocess(null, htmlTpl);
          })
          .then(html =>
            this.sender.send(
              (sender && sender.email() || this.defaultSenderEmail),
              rcvrs,
              {
                subject: notification.subject,
                html: html,
                plain: plain
              }
            )
          )
          .catch((err) => {
            if (this.log) {
              this.log.warn('Не удалось отправить оповещения на адреса электронной почты: ', rcvrs.join(', '));
              this.log.error(err);
            }
          });
      }
    } else {
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
                (sender && sender.email() || this.defaultSenderEmail),
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
                this.log.warn('Не удалось отправить оповещение на электронную почту ' + reciever.email());
                this.log.error(err);
              }
            });
        }
      });
    }
    return p;
  }
}

module.exports = EmailNotifier;