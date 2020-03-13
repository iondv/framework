'use strict';

const assert = require('assert').strict;
const IonLogger = require('core/impl/log/IonLogger');
const testLog = new IonLogger({});

testLog.log('DataSource test.');

const Ds = require(process.argv[2]);
const options = {
  logger: testLog,
  uri: process.argv[3],
  options: {
    connectionString: process.argv[3]
  }
};
const dsInstance = new Ds(options);

Promise.resolve(dsInstance.connection())
  .then(result => assertDisconnection(result, 'Check connection before open'))
  .then(() => dsInstance.close())
  .then(result => assertDisconnection(result, 'Check close before open'))

  .then(() => Promise.all([
    dsInstance.open()
      .then(result => assertConnection(result, 'Check open')),
    dsInstance.open()
      .then(result => assertConnection(result, 'Check open while open')),
    Promise.resolve(dsInstance.connection())
      .then(result => assertDisconnection(result, 'Check connection while opening')),
    dsInstance.close()
      .then(result => assertDisconnection(result, 'Check close while opening'))
  ]))

  .then(() => dsInstance.open())
  .then(result => assertConnection(result, 'Check open after open'))
  .then(() => assertConnection(dsInstance.connection(), 'Check connection after open'))

  .then(() => Promise.all([
    dsInstance.close()
      .then(result => assertDisconnection(result, 'Check close after open')),
    dsInstance.close()
      .then(result => assertDisconnection(result, 'Check close while close')),
    dsInstance.open()
      .then(result => assertDisconnection(result, 'Check open while close')),
    Promise.resolve(dsInstance.connection())
      .then(result => assertDisconnection(result, 'Check connection while opening'))
  ]))

  .then(() => dsInstance.connection())
  .then(result => assertDisconnection(result, 'Check connection after close'))
  .then(dsInstance.close())
  .then(result => assertDisconnection(result, 'Check close after close'))
  .then(dsInstance.open())
  .then(result => assertConnection(result, 'Check open after close'))
  .then(() => dsInstance.close())
  .then(() => {
    testLog.log('DataSource test successfully passed.');
    process.exit();
  })
  .catch((error) => {
    testLog.error(error);
    process.exit(1);
  });

function assertConnection (result, message) {
  assert.ok(result, message);
}

function assertDisconnection (result, message) {
  assert.equal(!!result, false, message);
}
