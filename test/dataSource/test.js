'use strict';

const assert = require('assert').strict;
const IonLogger = require('core/impl/log/IonLogger');
const testLog = new IonLogger({});

testLog.log('DataSource test.');

const Ds = require(process.argv[2]);
const dsInstance = new Ds({
  logger: testLog,
  uri: 'mongodb://127.0.0.1:27017/admin',
/*  url: {
    hosts: "[[db.hosts]]",
    user: "[[db.user]]",
    pwd: "[[db.pwd]]",
    db: "[[db.dbname]]",
    params: {
      authMechanism: [[db.authMechanism]]
    }
  },
  options: {
    keepAlive: 1,
    connectTimeoutMS: "[[db.connectTimeOut]]",
    socketTimeoutMS: "[[db.operTimeOut]]",
    poolSize: "[[db.poolSize]]",
    sslValidate: "[[db.sslValidate]]",
    checkServerIntegrity: "[[db.checkServerIntegrity]]",
    sslCA: "[[db.sslCA]]",
    sslCert: "[[db.sslCert]]",
    sslKey: "[[db.sslKey]]",
    sslPass: "[[db.sslPass]]",
    replicaSet: "[[db.replicaSet]]",
    authSource: "[[db.authSource]]",
    ssl: "[[db.ssl]]"
  }
*/
});

Promise.resolve(dsInstance.connection())
  .then(result => assertDisconnection(result, 'Check connection before open'))
  .then(() => dsInstance.close())
  .then(result => assertDisconnection(result, 'Check close before open'))
  .then(() => Promise.all([
    dsInstance.open().then(result => assertConnection(result, 'Check open')),
    dsInstance.open().then(result => assertConnection(result, 'Check open while open')),
    Promise.resolve(dsInstance.connection()).then(result => assertDisconnection(result, 'Check connection while opening')),
    dsInstance.close().then(result => assertDisconnection(result, 'Check close while opening'))
  ]))
  .then(() => dsInstance.open())
  .then(result => assertConnection(result, 'Check open after'))
  .then(() => assertConnection(dsInstance.connection(), 'Check connection after open'))
  .then(() => Promise.all([
    dsInstance.close().then(result => assertDisconnection(result, 'Check close after open')),
    dsInstance.close().then(result => assertDisconnection(result, 'Check close while close')),
    dsInstance.open().then(result => assertDisconnection(result, 'Check open while close')),
    Promise.resolve(dsInstance.connection()).then(result => assertDisconnection(result, 'Check connection while opening'))
  ]))
  .then(() => dsInstance.connection())
  .then(result => assertDisconnection(result, 'Check connection after close'))
  .then(dsInstance.close())
  .then(result => assertDisconnection(result, 'Check close after close'))
  .then(dsInstance.open())
  .then(result => assertConnection(result, 'Check open after close'))
  .then(() => dsInstance.close())
  .then(() => testLog.log('DataSource test successfully passed.'))
  .catch(err => testLog.error(err));

function assertConnection (result, message) {
  //TODO
  testLog.log(result);
  assert.ok(result, message);
}

function assertDisconnection (result, message) {
  assert.equal(!!result, false, message);
}
