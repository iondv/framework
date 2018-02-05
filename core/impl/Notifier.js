'use strict';
const cuid = require('cuid');
const F = require('core/FunctionCodes');

const INotifier = require('core/interfaces/Notifier');

class Notifier extends INotifier {

  /**
   * @param {{}} options
   * @param {DataSource} options.dataSource
   */
  constructor(options) {
    this.ds = options.dataSource;
  }

  /**
   * @param {String} sender
   * @param {String[]} recievers
   * @param {String} subject
   * @param {String} message
   * @returns {Promise}
   */
  _notify(sender, recievers, subject, message) {
    let id = cuid();
    return this.ds
      .insert(
        'ion_notification',
        {
          id,
          date: new Date(),
          sender,
          subject,
          message
        },
        {skipResult: true}
      )
      .then(() => {
        let p = Promise.resolve();
        recievers.forEach((r) => {
          p = p.then(() => this.ds.insert(
            'ion_notification_recievers',
            {
              id,
              reciever: r,
              recieved: null
            },
            {skipResult: true}
          ));
        });
        return p;
      })
      .then(() => id);
  }

  /**
   * @param {String} reciever
   * @param {String} id
   * @returns {Promise}
   */
  _markAsRead(reciever, id) {
    return this.ds.update(
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
      f = {[F.EQUAL]: [f, {[F.EMPTY]: ['$recieved']}]};
    }
    return this.ds.fetch(
      'ion_notification_recievers',
      {
        fields: {
          id: '$id',
          date: '$n.date',
          message: '$n.message',
        },
        filter: f,
        join: [
          {
            table: 'ion_notification',
            left: 'id',
            right: 'id',
            filter: {[F.EQUAL]: ['$reciever', reciever]},
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