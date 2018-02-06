const INotificationSender = require('core/interfaces/NotificationSender');
const resolvePath = require('core/resolvePath');
const ejs = require('ejs');
const path = require('path');

class EmailNotifier extends INotificationSender {
  /**
   * @param {{}} options
   * @param {EmailSender} options.sender
   * @param {String} options.tplDir
   * @param {Logger} options.log
   */
  construct(options) {
    this.sender = options.sender;
    this.tplDir = options.tplDir ? resolvePath(options.tplDir) : null;
    this.log = options.log;
  }

  /**
   * @param {User} sender
   * @param {User[]} recievers
   * @param {{subject: String, message: String, options: {}}} notification
   * @returns {*}
   */
  _send(sender, recievers, notification) {
    let tpl;
    if (notification.options) {
      if (typeof notification.options === 'string') {
        tpl = notification.options;
      } else if (typeof notification.options === 'object') {
        tpl = notification.options.tpl;
      }
    }
    let p = Promise.resolve();
    if (tpl && this.tplDir) {
      tpl = path.join(this.tplDir, tpl);
    } else {
      tpl = null;
    }
    recievers.forEach((reciever) => {
      if (reciever.email()) {
        p = p
          .then(() => {
            if (tpl) {
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
                  (err, content) => {
                    if (err) {
                      return reject(err);
                    }
                    this.sender.send(sender && sender.email(), reciever.email(), {
                      subject: notification.subject,
                      body: content,
                      type: 'html'
                    }).then(resolve).catch(reject);
                  });
              });
            } else {
              return this.sender.send(sender && sender.email(), reciever.email(), {
                subject: notification.subject,
                body: String(notification.message),
                type: 'plain'
              });
            }
          })
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