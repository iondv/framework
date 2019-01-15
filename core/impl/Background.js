'use strict';

const child = require('child_process');
const toAbsolutePath = require('core/system').toAbsolute;
const merge = require('merge');
const F = require('core/FunctionCodes');
const clone = require('fast-clone');

/**
 * @param {{}} options
 * @param {DataSource} options.dataSource
 * @constructor
 */
function Background(options) {

  const pool = {};

  const workers = {};

  const tableName = 'ion_bg_tasks';

  /**
   * @param {String} uid
   * @param {String} name
   * @param {String} sid
   * @returns {Promise}
   */
  function getTask(uid, name, sid) {
    return options.dataSource
      .get(
        tableName,
        {[F.AND]: [{[F.EQUAL]: ['$uid', uid]}, {[F.EQUAL]: ['$name', name]}, {[F.EQUAL]: ['$sid', sid]}]}
      );
  }

  /**
   * @param {String} uid
   * @param {String} name
   * @param {String} sid
   * @param {*} msg
   * @returns {Promise}
   */
  function saveResult(uid, name, sid, msg) {
    return getTask(uid, name, sid)
      .then((t) => {
        t.results.push(msg);
        return options.dataSource.update(
          tableName,
          {[F.AND]: [{[F.EQUAL]: ['$uid', uid]},{[F.EQUAL]: ['$name', name]},{[F.EQUAL]: ['$sid', sid]}]},
          t
        );
      })
      .catch((err) => {
        (options.log || console).error(err);
      });
  }

  function fixTask(uid, name, sid) {
    return options.dataSource.update(
      tableName,
      {[F.AND]: [{[F.EQUAL]: ['$uid', uid]}, {[F.EQUAL]: ['$name', name]}, {[F.EQUAL]: ['$sid', sid]}]},
      {state: Background.IDLE}
      )
      .catch((err) => {(options.log || console).error(err);});
  }

  /**
   * @param {String} uid
   * @param {String} name
   * @param {String} sid
   * @param {{}} moptions
   * @returns {Promise}
   */
  this.start = function (uid, name, sid, moptions) {
    if (typeof workers[name] === 'undefined') {
      throw new Error('Task is not registered in background!');
    }

    const workerOpts = clone(workers[name] || {});
    const nodeOpts = (workerOpts.node || []).concat(process.execArgv).filter((v, i, a) => a.indexOf(v) === i);
    delete workerOpts.node;
    moptions = merge(true, workerOpts, moptions || {});

    if (typeof pool[uid] === 'undefined') {
      pool[uid] = {};
    }
    if (typeof pool[uid][name] === 'undefined') {
      pool[uid][name] = {};
    }
    if (typeof pool[uid][name][sid] !== 'undefined') {
      throw new Error('Task ' + name + '[' + sid + '] is already running!');
    }

    return getTask(uid, name, sid)
      .then(
        (running) => {
          if (running && running.state === Background.RUNNING) {
            throw new Error('Task ' + name + '[' + sid + '] is already running!');
          }
        }
      )
      .then(
        () => options.dataSource.upsert(
          tableName,
          {[F.AND]: [{[F.EQUAL]: ['$uid', uid]}, {[F.EQUAL]: ['$name', name]}, {[F.EQUAL]: ['$sid', sid]}]},
          {uid, name, sid, results: [], state: Background.RUNNING},
          {skipResult: true}
        )
      )
      .then(
        () => {
          let args = ['-task', name, '-uid', uid, '-sid', sid];
          for (let nm in moptions) {
            if (moptions.hasOwnProperty(nm) && typeof moptions[nm] !== 'undefined' && moptions[nm] !== null) {
              args.push('-' + nm);
              args.push(moptions[nm]);
            }
          }

          pool[uid][name][sid] = child.fork(
            toAbsolutePath('bin/bg'),
            args,
            {
              execArgv: nodeOpts,
              stdio: ['pipe', 'inherit', 'inherit', 'ipc']
            }
          );
          let ch = pool[uid][name][sid];
          ch.on('message', (msg) => {
            saveResult(uid, name, sid, msg);
          });
          ch.on('exit', () => {
            fixTask(uid, name, sid);
            if (pool[uid] && pool[uid][name] && pool[uid][name][sid]) {
              delete pool[uid][name][sid];
            }
          });
          ch.on('error', (err) => {
            (options.log || console).error(err);
            fixTask(uid, name, sid);
            if (pool[uid] && pool[uid][name] && pool[uid][name][sid]) {
              delete pool[uid][name][sid];
            }
          });
          return sid;
        }
      );
  };

  /**
   * @param {String} uid
   * @param {String} name
   * @param {String} sid
   * @return {Promise}
   */
  this.status = (uid, name, sid) => {
    if (typeof workers[name] === 'undefined') {
      throw new Error('task is not registered in background!');
    }
    return getTask(uid, name, sid).then(t => t ? t.state : Background.IDLE);
  };

  /**
   * @param {String} uid
   * @param {String} name
   * @param {String} sid
   * @returns {Promise}
   */
  this.results = (uid, name, sid) => {
    if (typeof workers[name] === 'undefined') {
      throw new Error('task is not registered in background!');
    }
    return getTask(uid, name, sid).then(t => t ? t.results : null);
  };

  this.register = (name, options) => {
    workers[name] = options || {};
  };
}

Background.IDLE = 0;
Background.RUNNING = 1;

module.exports = Background;
