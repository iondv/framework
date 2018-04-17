'use strict';

const child = require('child_process');
const toAbsolutePath = require('core/system').toAbsolute;
const Logger = require('core/interfaces/Logger');

function Background() {

  let pool = {};

  let results = {};

  let workers = {};

  this.start = function (uid, name, options) {
    if (typeof workers[name] === 'undefined') {
      throw new Error('Task is not registered in background!');
    }

    options = options || {};

    if (typeof pool[uid] === 'undefined') {
      pool[uid] = {};
    }
    if (typeof pool[uid][name] !== 'undefined') {
      throw new Error(`Task ${name} is already running!`);
    }

    let args = ['-task', name];
    for (let nm in options) {
      if (options.hasOwnProperty(nm)) {
        args.push('-' + nm);
        args.push(options[nm]);
      }
    }

    if (!results[uid]) {
      results[uid] = {};
    }
    results[uid][name] = [];

    let ch = pool[uid][name] = child.fork(toAbsolutePath('bin/bg'), args, {stdio: ['pipe', 'inherit', 'inherit', 'ipc']});
    ch.on('message', (msg) => {
      results[uid][name].push(msg);
    });
    ch.on('exit', () => {
      if (pool[uid] && pool[uid][name]) {
        delete pool[uid][name];
      }
    });
    ch.on('error', (err) => {
      if (options.log instanceof Logger) {
        options.log.error(err);
      }
      if (pool[uid] && pool[uid][name]) {
        delete pool[uid][name];
      }
    });
  };

  this.status = function (uid, name) {
    if (typeof workers[name] === 'undefined') {
      throw new Error('task is not registered in background!');
    }
    if (typeof pool[uid] === 'undefined' || typeof pool[uid][name] === 'undefined') {
      return Background.IDLE;
    }
    return Background.RUNNING;
  };

  this.results = function (uid, name) {
    if (typeof workers[name] === 'undefined') {
      throw new Error('task is not registered in background!');
    }
    if (typeof results[uid] !== 'undefined' || typeof results[uid][name] !== 'undefined') {
      return results[uid][name];
    }
    return [];
  };

  this.register = function (name, options) {
    workers[name] = options;
  };
}

Background.IDLE = 0;
Background.RUNNING = 1;

module.exports = Background;
