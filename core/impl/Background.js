'use strict';

const child = require('child_process');
const toAbsolutePath = require('core/system').toAbsolute;
const Logger = require('core/interfaces/Logger');
const merge = require('merge');

function Background() {

  let seq = 1;

  let pool = {};

  let results = {};

  let workers = {};

  this.start = function (uid, name, options) {
    if (typeof workers[name] === 'undefined') {
      throw new Error('Task is not registered in background!');
    }

    options = merge(true, workers[name] || {}, options || {});

    if (typeof pool[uid] === 'undefined') {
      pool[uid] = {};
    }
    if (typeof pool[uid][name] === 'undefined') {
      pool[uid][name] = {};
    }

    let sid = seq++;

    let args = ['-task', name, '-uid', uid];
    for (let nm in options) {
      if (options.hasOwnProperty(nm)) {
        args.push('-' + nm);
        args.push(options[nm]);
      }
    }

    if (!results[uid]) {
      results[uid] = {};
    }
    if (!results[uid][name]) {
      results[uid][name] = {};
    }
    results[uid][name][sid] = [];

    let ch = pool[uid][name][sid] = child.fork(toAbsolutePath('bin/bg'), args, {stdio: ['pipe', 'inherit', 'inherit', 'ipc']});
    ch.on('message', (msg) => {
      results[uid][name][sid].push(msg);
    });
    ch.on('exit', () => {
      if (pool[uid] && pool[uid][name] && pool[uid][name][sid]) {
        delete pool[uid][name][sid];
      }
    });
    ch.on('error', (err) => {
      if (options.log instanceof Logger) {
        options.log.error(err);
      }
      if (pool[uid] && pool[uid][name] && pool[uid][name][sid]) {
        delete pool[uid][name][sid];
      }
    });
    return sid;
  };

  this.status = function (uid, name, sid) {
    if (typeof workers[name] === 'undefined') {
      throw new Error('task is not registered in background!');
    }
    if (
      typeof pool[uid] === 'undefined' ||
      typeof pool[uid][name] === 'undefined' ||
      typeof pool[uid][name][sid] === 'undefined'
    ) {
      return Background.IDLE;
    }
    return Background.RUNNING;
  };

  this.results = function (uid, name, sid) {
    if (typeof workers[name] === 'undefined') {
      throw new Error('task is not registered in background!');
    }
    if (
      typeof results[uid] !== 'undefined' &&
      typeof results[uid][name] !== 'undefined' &&
      typeof results[uid][name][sid] !== 'undefined'
    ) {
      return results[uid][name][sid];
    }
    return [];
  };

  this.register = function (name, options) {
    workers[name] = options || {};
  };
}

Background.IDLE = 0;
Background.RUNNING = 1;

module.exports = Background;
