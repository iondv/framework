/* eslint-disable max-statements */
/* eslint-disable require-jsdoc */
'use strict';

const assert = require('assert').strict;
const IonLogger = require('core/impl/log/IonLogger');
const testLog = new IonLogger({});
const Operations = require('core/FunctionCodes');

const Ds = require(process.argv[2]);

runTests(process.argv[3], process.argv[4], process.argv[5]);

// eslint-disable-next-line complexity
async function runTests(connectionString, mask, explicitLog = false) {
  const options = {
    logger: testLog,
    queryLogging: explicitLog,
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
      await testInserting(ds, explicitLog);
    } catch (error) {
      testLog.error(error);
    }
  }
  if (mask & 4) {
    try {
      await testDeleting(ds, explicitLog);
    } catch (error) {
      testLog.error(error);
    }
  }
  if (mask & 8) {
    try {
      await testUpdating(ds, explicitLog);
    } catch (error) {
      testLog.error(error);
    }
  }
  if (mask & 16) {
    try {
      await testUpserting(ds, explicitLog);
    } catch (error) {
      testLog.error(error);
    }
  }
  if (mask & 32) {
    try {
      await testSelecting(ds, explicitLog);
    } catch (error) {
      testLog.error(error);
    }
  }
  if (mask & 64) {
    try {
      await testEnsureIndex(ds, explicitLog);
    } catch (error) {
      testLog.error(error);
    }
  }
  if (mask & 128) {
    try {
      await testEnsureAutoincrement(ds, explicitLog);
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

function createTestTable(dsInstance, explicitLog, table, fields) {
  return dsInstance.open()
    .then(() => explicitLog && testLog.log(`Create test-table '${table}'.`))
    .then(() => dsInstance.connection())
    .then(client => client.query(`CREATE TABLE IF NOT EXISTS ${table} (${fields.join(',')});`)
      .finally(() => client.release()));
}

function dropTestTable(dsInstance, explicitLog, table) {
  return dsInstance.open()
    .then(() => explicitLog && testLog.log(`Drop test-table '${table}'.`))
    .then(() => dsInstance.connection())
    .then(client => client.query(`DROP TABLE IF EXISTS ${table} CASCADE;`)
      .finally(() => client.release()));
}

function insertTestRow(dsInstance, explicitLog, table, data) {
  return dsInstance.open()
    .then(() => explicitLog && testLog.log(`Insert test-row in table '${table}'.`))
    .then(() => dsInstance.connection())
    .then(client => client.query(`INSERT INTO ${table} (${Object.keys(data).join(',')}) VALUES (${Object.values(data).join(',')});`)
      .finally(() => client.release()));
}

function selectTestRows(dsInstance, explicitLog, table, details) {
  return dsInstance.open()
    .then(() => explicitLog && testLog.log(`Select test-rows from table '${table}'.`))
    .then(() => dsInstance.connection())
    .then(client => client.query(`SELECT * FROM ${table} ${details};`)
      .finally(() => client.release()));
}

function testInserting(dsInstance, explicitLog) {
  const type = 'for_insert';
  const data = {
    string: 'azaza', number: 12, bool: false, date: new Date(2020, 2, 20, 0, 0, 0, 0)
  };
  return dsInstance.open()
    .then(() => explicitLog && testLog.log('============================================'))
    .then(() => createTestTable(dsInstance, explicitLog, type, [
      'string varchar(40)', 'number integer', 'bool boolean', 'date date'
    ]))
    .then(() => explicitLog && testLog.log('DataSource inserting test.'))
    .then(() => dsInstance.insert(type, data, {skipResult: false, adjustAutoInc: true}))
    .then(res => assert.deepStrictEqual(res, data, 'Check result.'))
    .then(() => selectTestRows(dsInstance, explicitLog, type))
    .then(res => assert.deepStrictEqual(res.rows[0], data, 'Check in database.'))
    .then(() => dropTestTable(dsInstance, explicitLog, type))
    .then(() => testLog.log('DataSource inserting test successfuly completed.'));
}

function testDeleting(dsInstance, explicitLog) {
  const type = 'for_delete';
  return dsInstance.open()
    .then(() => explicitLog && testLog.log('============================================'))
    .then(() => createTestTable(dsInstance, explicitLog, type, ['string varchar(40)']))
    .then(() => insertTestRow(dsInstance, explicitLog, type, {string: '\'azaza\''}))
    .then(() => explicitLog && testLog.log('DataSource deleting test.'))
    .then(() => dsInstance.delete(type, explicitLog, {[Operations.EQUAL]: ['$string', 'azaza']}))
    .then(() => selectTestRows(dsInstance, explicitLog, type))
    .then(res => assert.equal(res.rowCount, 0))
    .then(() => dropTestTable(dsInstance, explicitLog, type))
    .then(() => testLog.log('DataSource deleting test successfuly completed.'));
}

function testUpdating(dsInstance, explicitLog) {
  const type = 'for_update';
  const conditions = {[Operations.EQUAL]: ['$bool', true]};
  const data = {string: 'check', bool: false, number: 4};
  const options = {slipResult: false, bulk: true, adjustAutoInc: true};
  return dsInstance.open()
    .then(() => explicitLog && testLog.log('============================================'))
    .then(() => createTestTable(dsInstance, explicitLog, type, ['string varchar(40)', 'number integer', 'bool boolean']))
    .then(() => insertTestRow(dsInstance, explicitLog, type, {string: '\'azaza\'', number: 1, bool: true}))
    .then(() => insertTestRow(dsInstance, explicitLog, type, {string: '\'ololo\'', number: 2, bool: false}))
    .then(() => insertTestRow(dsInstance, explicitLog, type, {string: '\'ikiki\'', number: 3, bool: true}))

    .then(() => explicitLog && testLog.log('DataSource updating test.'))
    .then(() => dsInstance.update(type, conditions, data, options))
    .then(res => assert.deepStrictEqual(res, [data, data], 'Check result.'))
    .then(() => selectTestRows(dsInstance, explicitLog, type, 'ORDER BY number ASC'))
    .then(res => assert.deepStrictEqual(res.rows, [{string: 'ololo', bool: false, number: 2}, data, data], 'Check in database.'))

    .then(() => dropTestTable(dsInstance, explicitLog, type))
    .then(() => testLog.log('DataSource updating test successfuly completed.'));
}

function testUpserting(dsInstance, explicitLog) {
  const type = 'for_upsert';
  const options = {slipResult: false, adjustAutoInc: true};
  const conditions = {[Operations.EQUAL]: ['$c', true]};
  const initial = {a: '\'azaza\'', b: 1, c: false};
  const data1 = {a: 'check', b: 2, c: true};
  const expecting1 = [{a: 'azaza', b: initial.b, c: initial.c}, data1];
  const data2 = {c: true};
  const expecting2 = {a: 'azaza', b: initial.b, c: true};
  const expecting3 = [expecting2, data1];
  return dsInstance.open()
    .then(() => explicitLog && testLog.log('============================================'))
    .then(() => createTestTable(dsInstance, explicitLog, type, ['a varchar(40)', 'b integer', 'c boolean']))
    .then(() => insertTestRow(dsInstance, explicitLog, type, initial))

    .then(() => explicitLog && testLog.log('DataSource upserting test.'))
    .then(() => dsInstance.upsert(type, conditions, data1, options))
    .then(res => assert.deepStrictEqual(res, data1, 'Check insert result.'))
    .then(() => selectTestRows(dsInstance, explicitLog, type, 'ORDER BY b ASC'))
    .then(res => assert.deepStrictEqual(res.rows, expecting1, 'Check insertion in database.')
    )
    .then(() => dsInstance.upsert(type, null, data2, options))
    .then(res => assert.deepStrictEqual(res, expecting2, 'Check update result.'))
    .then(() => selectTestRows(dsInstance, explicitLog, type, 'ORDER BY b ASC'))
    .then(res => assert.deepStrictEqual(res.rows, expecting3, 'Check update in database.'))

    .then(() => dropTestTable(dsInstance, explicitLog, type))
    .then(() => testLog.log('DataSource upserting test successfuly completed.'));
}

function testSelecting(dsInstance, explicitLog) {
  //TODO
}

function testEnsureIndex(dsInstance, explicitLog) {
  const type = 'for_ensure_index';

  return dsInstance.open()
    .then(() => explicitLog && testLog.log('============================================'))
    .then(() => createTestTable(dsInstance, explicitLog, type, ['a varchar(40)', 'b integer']))

    .then(() => explicitLog && testLog.log('DataSource ensure index test.'))
    .then(() => dsInstance.ensureIndex(type, {a: 1, b: -1}, {unique: true}))
    .then(res => selectTestRows(dsInstance, explicitLog, 'pg_indexes', `WHERE tablename='${type}'`)
      .then(res2 => assert.strictEqual(res, res2.rows[0].indexname, 'Check index in database.'))
      .then(() => insertTestRow(dsInstance, explicitLog, type, {a: '\'azaza\'', b: 0}))
      .then(() => assert.rejects(
        insertTestRow(dsInstance, explicitLog, type, {a: '\'azaza\'', b: 0}),
        {
          table: type,
          constraint: res,
          code: '23505'
        },
        'Check unique violation.'
      ))
      .then(() => insertTestRow(dsInstance, explicitLog, type, {a: 'null', b: 'null'}))
      .then(() => assert.doesNotReject(
        insertTestRow(dsInstance, explicitLog, type, {a: 'null', b: 'null'}),
        null,
        'Check sparse index.'
      )))

    .then(() => dropTestTable(dsInstance, explicitLog, type))
    .then(() => testLog.log('DataSource ensure index test successfuly completed.'));
}

function testEnsureAutoincrement(dsInstance, explicitLog) {
  const type = 'for_ensure_autoincrement';
  const properties = {
    b: 1,
    c: {step: 3, start: 2},
    d: {step: -2, start: -2}
  };
  const expecting = [
    {a: 'azaza', b: 1, c: 2, d: -2},
    {a: 'ololo', b: 2, c: 5, d: -4},
    {a: 'ikiki', b: 3, c: 8, d: -6}
  ];

  return dsInstance.open()
    .then(() => explicitLog && testLog.log('============================================'))
    .then(() => createTestTable(dsInstance, explicitLog, type, ['a varchar(40)', 'b integer', 'c integer', 'd integer']))

    .then(() => explicitLog && testLog.log('DataSource ensure autoincrement test.'))
    .then(() => dsInstance.ensureAutoincrement(type, properties))
    .then(res => insertTestRow(dsInstance, explicitLog, type, {
      a: '\'azaza\'',
      b: `nextval('${res.b}')`,
      c: `nextval('${res.c}')`,
      d: `nextval('${res.d}')`})
      .then(() => insertTestRow(dsInstance, explicitLog, type, {
        a: '\'ololo\'',
        b: `nextval('${res.b}')`,
        c: `nextval('${res.c}')`,
        d: `nextval('${res.d}')`}))
      .then(() => insertTestRow(dsInstance, explicitLog, type, {
        a: '\'ikiki\'',
        b: `nextval('${res.b}')`,
        c: `nextval('${res.c}')`,
        d: `nextval('${res.d}')`})))
    .then(() => selectTestRows(dsInstance, explicitLog, type, 'ORDER BY b ASC'))
    .then(res => assert.deepStrictEqual(res.rows, expecting, 'Check autoincremented rows from database.'))

    .then(() => dropTestTable(dsInstance, explicitLog, type))
    .then(() => testLog.log('DataSource ensure index test successfuly completed.'));
}