'use strict';
const cuid = require('cuid');
const ejs = require('ejs');
const F = require('core/FunctionCodes');

const INotifier = require('core/interfaces/Notifier');
const INotificationSender = require('core/interfaces/NotificationSender');
const resolvePath = require('core/resolvePath');
const path = require('path');
const User = require('core/User');
const merge = require('merge');

class Notifier extends INotifier {

  /**
   * @param {{}} options
   * @param {DataSource} options.dataSource
   * @param {AccountStorage} options.accounts
   * @param {{}} options.dispatchers
   * @param {String} options.systemSender
   * @param {Logger} options.log
   * @param {String} options.tplDir
   * @param {{}} [options.templates]
   */
  constructor(options) {
    super();
    this.ds = options.dataSource;
    this.accounts = options.accounts;
    this.dispatchers = options.dispatchers;
    this.tplDir = options.tplDir ? resolvePath(options.tplDir) : null;
    this.system = options.systemSender || 'ion.system';
    this.log = options.log;
    this.templates = options.templates;
  }

  /**
   * @param {{}} notification
   * @param {{} | String} notification.message
   * @param {String} notification.type
   * @param {String} [notification.sender]
   * @param {String[] | String} [notification.recievers]
   * @param {String} [notification.subject]
   * @param {{}} [notification.dispatch]
   * @param {String} [notification.options]
   * @returns {Promise}
   */
  _notify(notification) {
    if (!notification.message) {
      throw new Error('Не указан текст уведомления.');
    }

    if (!notification.type) {
      notification.type = 'untyped';
    }

    const preprocess = () => {
      if (this.tplDir && this.templates && this.templates[notification.type]) {
        let tpl = this.templates[notification.type];
        tpl = path.join(this.tplDir, tpl);
        return new Promise((resolve, reject) => {
            ejs.renderFile(
              tpl,
              {
                subject: notification.subject,
                message: notification.message
              },
              {},
              (err, content) => {
                if (err) {
                  return reject(err);
                }
                resolve(content);
              });
          }
        );
      }
      return false;
    };

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

    if (rcvrs.length == 0) {
      return Promise.resolve();
    }

    return this.accounts
      .list(rcvrs)
      .then(
        (recievers) => {
          let p = Promise.resolve();
          if (recievers.length) {
            let senderAccount = null;
            if (notification.sender) {
              p = p.then(() => this.accounts.get(notification.sender)).then((u) => {
                senderAccount = u;
              });
            }

            Object.keys(this.dispatchers).forEach((dest) => {
              if (this.dispatchers[dest] instanceof INotificationSender) {
                let rcvrs = [];
                recievers.forEach((r) => {
                  if (r instanceof User) {
                    let notifyTo = r.properties().notifyTo;
                    if (
                      (!notifyTo && !notification.dispatch) ||
                      (Array.isArray(notifyTo) && (notifyTo.indexOf(dest) >= 0)) ||
                      (notification.dispatch && notification.dispatch[dest])
                    ) {
                      rcvrs.push(r);
                    }
                  }
                });
                if (rcvrs.length) {
                  p = p
                    .then(() =>
                      this.dispatchers[dest].send(
                        senderAccount,
                        rcvrs,
                        {
                          message: notification.message,
                          subject: notification.subject,
                          type: notification.type,
                          options: merge(
                            notification.options || {},
                            (notification.dispatch && notification.dispatch[dest]) || {}
                          )
                        }
                      )
                    )
                    .catch((err) => {
                      if (this.log) {
                        this.log.warn('Ошибка при отправке уведомления в ' + dest);
                        this.log.info(notification.subject);
                        this.log.info(notification.message);
                        this.log.error(err);
                      }
                    });
                }
              }
            });
          }

          if (recievers.length && (!notification.dispatch || notification.dispatch.hasOwnProperty('native'))) {
            let id = cuid();
            p = p
              .then(preprocess)
              .then(
                message => this.ds.insert(
                  'ion_notification',
                  {
                    id,
                    date: new Date(),
                    sender: notification.sender || this.system,
                    subject: notification.subject,
                    message: message || String(notification.message),
                    raw: message ? notification.message : null,
                    options: merge(
                      notification.options || {},
                      notification.dispatch && notification.dispatch.native || {}
                    )
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
        }
      );
  }

  _withdraw(id) {
    return this.ds.delete('ion_notification', {[F.EQUAL]: ['$id', id]})
      .then(() => this.ds.delete('ion_notification_recievers', {[F.EQUAL]: ['$id', id]}))
      .catch((err) => {
        if (this.log) {
          this.log.error(err);
        }
        throw new Error('Не удалось отозвать уведомление ' + id);
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
   * @param {String} reciever
   * @returns {Promise}
   */
  _markAllAsRead(reciever) {
    return this.ds.upsert(
      'ion_notification_recievers',
      {
        [F.AND]: [
          {[F.EMPTY]: ['$recieved']},
          {[F.EQUAL]: ['$reciever', reciever]}
        ]
      },
      {
        recieved: new Date()
      }, {
        bulk: true
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
   * @param {{sender: String, offset: Number, count: Number, new: Boolean, since: Date}} options
   * @returns {Promise}
   */
  _list(reciever, options) {
    let f = [];
    if (reciever) {
      f.push({[F.EQUAL]: ['$reciever', reciever]});
    }
    if (options.sender) {
      f.push({[F.EQUAL]: ['$n.sender', options.sender]});
    }
    if (options.new) {
      f.push({[F.EMPTY]: ['$recieved']});
    }
    if (options.viewed) {
      f.push({[F.NOT_EMPTY]: ['$recieved']});
    }
    if (options.since) {
      f.push({[F.GREATER_OR_EQUAL]: ['$n.date', options.since]});
    }
    return this.ds.fetch(
      'ion_notification_recievers',
      {
        fields: {
          id: '$id',
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
        distinct: true,
        offset: options.offset,
        count: options.count,
        countTotal: options.countTotal
      }
    );
  }
}

module.exports = Notifier;