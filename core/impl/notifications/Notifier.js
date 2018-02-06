'use strict';
const cuid = require('cuid');
const F = require('core/FunctionCodes');

const INotifier = require('core/interfaces/Notifier');
const INotificationSender = require('core/interfaces/NotificationSender');

class Notifier extends INotifier {

  /**
   * @param {{}} options
   * @param {DataSource} options.dataSource
   * @param {AccountStorage} options.accounts
   * @param {{}} options.dispatchers
   * @param {String} options.systemSender
   * @param {Logger} options.log
   */
  constructor(options) {
    this.ds = options.dataSource;
    this.accounts = options.accounts;
    this.dispatchers = options.dispatchers;
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
    let recievers = [];
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
    let p = this.accounts.list(rcvrs).then((users) => {
      recievers.push(...users);
    });

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

    if (!notification.dispatch || notification.dispatch.hasOwnProperty('native')) {
      let id = cuid();
      p = p.then(() => this.ds
        .insert(
          'ion_notification',
          {
            id,
            date: new Date(),
            sender: notification.sender || this.system,
            subject: notification.subject,
            message: notification.message,
            options: notification.dispatch && notification.dispatch.native
          },
          {skipResult: true}
        ))
        .then(() => {
          if (recievers.length) {
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
            return p;
          }
        })
        .then(() => id)
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
   * @param {{offset: Number, count: Number, new: Boolean}} options
   * @returns {Promise}
   */
  _list(reciever, options) {
    let f = {[F.EQUAL]: ['$reciever', reciever]};
    if (options.new) {
      f = {[F.AND]: [f, {[F.EMPTY]: ['$recieved']}]};
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
        filter: f,
        join: [
          {
            table: 'ion_notification',
            left: 'id',
            right: 'id',
            alias: 'n'
          }
        ],
        offset: options.offset,
        count: options.count
      }
    );
  }
}

module.exports = Notifier;