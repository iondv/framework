/* eslint-disable max-statements */
/* eslint-disable require-jsdoc */
'use strict';

const assert = require('assert').strict;
const IonLogger = require('core/impl/log/IonLogger');
const testLog = new IonLogger({});

const Ds = require(process.argv[2]);

runTests(process.argv[3], process.argv[4]);

// eslint-disable-next-line complexity
async function runTests(connectionString, mask) {
  const options = {
    logger: testLog,
    options: {
      connectionString
    }
  };
  const ds = new Ds(options);

  if (mask & 1) {
    try {
      testLog.log('DataSource connection test.');
      await testConnecting(ds);
      testLog.log('DataSource connection test successfully passed.');
    } catch (error) {
      testLog.error(error);
    }
  }
  if (mask & 2) {
    try {
      testLog.log('DataSource inserting test.');
      await testInserting(ds);
      testLog.log('DataSource inserting test successfully passed.');
    } catch (error) {
      testLog.error(error);
    }
  }
  if (mask & 4) {
    try {
      testLog.log('DataSource deleting test.');
      await testDeleting(ds);
      testLog.log('DataSource deleting test successfully passed.');
    } catch (error) {
      testLog.error(error);
    }
  }
  if (mask & 8) {
    try {
      testLog.log('DataSource updating test.');
      await testUpserting(ds);
      testLog.log('DataSource updating test successfully passed.');
    } catch (error) {
      testLog.error(error);
    }
  }
  if (mask & 16) {
    try {
      testLog.log('DataSource upserting test.');
      await testUpserting(ds);
      testLog.log('DataSource upserting test successfully passed.');
    } catch (error) {
      testLog.error(error);
    }
  }
  process.exit();
}

/**
 * @param {*} dsInstance 
 */
function testConnecting(dsInstance) {
  return Promise.resolve(dsInstance.connection())
    .then(result => assertDisconnection(result, 'Check connection before open'))
    .then(() => dsInstance.close())
    .then(result => assertDisconnection(result, 'Check close before open'))
    .then(() => dsInstance.open())
    .then(result => assertConnection(result, 'Check open'))
    .then(() => dsInstance.open())
    .then(result => assertConnection(result, 'Check open after open'))
    .then(() => assertConnection(dsInstance.connection(), 'Check connection after open'))
//TODO BUG далее промис обрывается
    .then(() => dsInstance.close())
    .then(result => assertDisconnection(result, 'Check close after open'))
    .then(() => dsInstance.connection())
    .then(result => assertDisconnection(result, 'Check connection after close'))
    .then(() => dsInstance.close())
    .then(result => assertDisconnection(result, 'Check close after close'))
    .then(() => dsInstance.open())
    .then(result => assertConnection(result, 'Check open after close'))
    .then(() => dsInstance.close());
}

function assertConnection (result, message) {
  assert.ok(result, message);
}

function assertDisconnection (result, message) {
  assert.equal(!!result, false, message);
}

function testInserting(dsInstance) {
  //TODO skipResult
  //TODO adjustAutoInc
  //TODO dataTypes
  //TODO errors
  return dsInstance.open()
    .then(() => dsInstance.insert('test', {test: 'Text'}))
    .then(res => console.log(res));
}

function testDeleting(dsInstance) {
  //TODO conditions
  //TODO only/skipResults
  //TODO errors
  return dsInstance.open()
    .then(() => dsInstance.delete('test'))
    .then(res => console.log(res));
}

function testUpdating(dsInstance) {

}

function testUpserting(dsInstance) {

}
