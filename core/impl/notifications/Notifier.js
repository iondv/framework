'use strict';
const cuid = require('cuid');
const ejs = require('ejs');
const F = require('core/FunctionCodes');

const INotifier = require('core/interfaces/Notifier');
const INotificationSender = require('core/interfaces/NotificationSender');
const resolvePath = require('core/resolvePath');
const path = require('path');

class Notifier extends INotifier {

  /**
   * @param {{}} options
   * @param {DataSource} options.dataSource
   * @param {AccountStorage} options.accounts
   * @param {{}} options.dispatchers
   * @param {String} options.systemSender
   * @param {Logger} options.log
   * @param {String} options.tplDir
   */
  constructor(options) {
    super();
    this.ds = options.dataSource;
    this.accounts = options.accounts;
    this.dispatchers = options.dispatchers;
    this.tplDir = options.tplDir ? resolvePath(options.tplDir) : null;
    this.system = options.systemSender || 'ion.system';
    this.log = options.log;
  }

  /**
   * @param {{}} notification
   * @param {{} | String} notification.message
   * @param {String} [notification.sender]
   * @param {String[] | String} [notification.recievers]
   * @param {String} [notification.subject]
   * @param {{}} [notification.dispatch]
   * @returns {Promise}
   */
  _notify(notification) {
    if (!notification.message) {
      throw new Error('Не указан текст уведомления.');
    }
    let rcvrs;
    if (!Array.isArray(notification.recievers)) {
      if (notification.recievers) {
        if (typeof notification.recievers === 'string') {
          rcvrs = notification.recievers.split(/\s+/);
        } else {
          rcvrs = [notification.recievers];
        }
      }
    } else {
      rcvrs = notification.recievers;
    }

    return this.accounts
      .list(rcvrs)
      .then(
        (recievers) => {
          let p = Promise.resolve();
          if (notification.dispatch) {
            let senderAccount = null;
            if (notification.sender) {
              p = p.then(() => this.accounts.get(notification.sender)).then((u) => {
                senderAccount = u;
              });
            }

            Object.keys(notification.dispatch).forEach((dest) => {
              if (this.dispatchers[dest] instanceof INotificationSender) {
                p = p.then(() => this.dispatchers[dest].send(senderAccount, recievers, {
                  message: notification.message,
                  subject: notification.subject,
                  options: notification.dispatch[dest]
                })).catch((err) => {
                  if (this.log) {
                    this.log.warn('Ошибка при отправке уведомления в ' + dest);
                    this.log.info(notification.subject);
                    this.log.info(notification.message);
                    this.log.error(err);
                  }
                });
              }
            });
          }

          if (recievers.length && (!notification.dispatch || notification.dispatch.hasOwnProperty('native'))) {
            let id = cuid();
            p = p
              .then(
                () => this.ds.insert(
                  'ion_notification',
                  {
                    id,
                    date: new Date(),
                    sender: notification.sender || this.system,
                    subject: notification.subject,
                    message: notification.message,
                    options: notification.dispatch && notification.dispatch.native
                  },
                  {}
                ))
              .then((n) => {
                let p = Promise.resolve();
                recievers.forEach((r) => {
                  p = p.then(() => this.ds.insert(
                    'ion_notification_recievers',
                    {
                      id,
                      reciever: r.id(),
                      recieved: null
                    },
                    {skipResult: true}
                  ));
                });
                return p.then(() => n);
              })
              .catch((err) => {
                if (this.log) {
                  this.log.warn('Не удалось отправить уведомление');
                  this.log.info(notification.subject);
                  this.log.info(notification.message);
                  this.log.error(err);
                }
              });
          }
          return p;
        });
  }

  /**
   * @param {String} reciever
   * @param {String} id
   * @returns {Promise}
   */
  _markAsRead(reciever, id) {
    return this.ds.upsert(
      'ion_notification_recievers',
      {
        [F.AND]: [
          {[F.EQUAL]: ['$id', id]},
          {[F.EQUAL]: ['$reciever', reciever]}
        ]
      },
      {
        recieved: new Date()
      });
  }

  /**
   * @param {String} id
   * @returns {Promise}
   * @private
   */
  _get(id) {
    return this.ds.get('ion_notification', {[F.EQUAL]: ['$id', id]});
  }

  /**
   * @param {String} reciever
   * @param {{offset: Number, count: Number, new: Boolean, since: Date}} options
   * @returns {Promise}
   */
  _list(reciever, options) {
    let f = [];
    if (reciever) {
      f.push({[F.EQUAL]: ['$reciever', reciever]});
    }
    if (options.new) {
      f.push({[F.EMPTY]: ['$recieved']});
    }
    if (options.since) {
      f.push({[F.GREATER_OR_EQUAL]: ['$n.date', options.since]});
    }
    return this.ds.fetch(
      'ion_notification_recievers',
      {
        fields: {
          id: '$id',
          recieved: '$recieved',
          date: '$n.date',
          sender: '$n.sender',
          subject: '$n.subject',
          message: '$n.message',
          options: '$n.options'
        },
        filter: f.length > 1 ? {[F.AND]: f} : f[0],
        joins: [
          {
            table: 'ion_notification',
            left: 'id',
            right: 'id',
            alias: 'n'
          }
        ],
        sort: {date: -1},
        offset: options.offset,
        count: options.count,
        countTotal: options.countTotal
      }
    ).then((list) => {
      let p = Promise.resolve();
      list.forEach((n) => {
        if (this.tplDir && n.options && (typeof n.options === 'string' || n.options.tpl)) {
          p = p.then(() => {
            let tpl = (typeof n.options === 'string') ? n.options : n.options.tpl;
            tpl = path.join(this.tplDir, tpl);
            return new Promise((resolve, reject) => {
              ejs.renderFile(
                tpl,
                {
                  subject: n.subject,
                  message: n.message
                },
                {},
                (err, content) => {
                  if (err) {
                    return reject(err);
                  }
                  n.message = content;
                  resolve();
                });
            });
          });
        }
      });
      return p.then(() => list);
    });
  }
}

module.exports = Notifier;