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
async function runTests(connectionString, mask, queryLogging = false) {
  const options = {
    logger: testLog,
    queryLogging,
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
      await testInserting(ds);
    } catch (error) {
      testLog.error(error);
    }
  }
  if (mask & 4) {
    try {
      await testDeleting(ds);
    } catch (error) {
      testLog.error(error);
    }
  }
  if (mask & 8) {
    try {
      await testUpdating(ds);
    } catch (error) {
      testLog.error(error);
    }
  }
  if (mask & 16) {
    try {
      await testUpserting(ds);
    } catch (error) {
      testLog.error(error);
    }
  }
  if (mask & 32) {
    try {
      await testSelecting(ds);
    } catch (error) {
      testLog.error(error);
    }
  }
  if (mask & 64) {
    try {
      await testEnsureIndex(ds);
    } catch (error) {
      testLog.error(error);
    }
  }
  if (mask & 128) {
    try {
      await testEnsureAutoincrement(ds);
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

function createTestTable(dsInstance, table, fields) {
  return dsInstance.open()
    .then(() => testLog.log(`Create test-table '${table}'.`))
    .then(() => dsInstance.connection())
    .then(client => client.query(`CREATE TABLE IF NOT EXISTS ${table} (${fields.join(',')});`)
      .finally(() => client.release()));
}

function dropTestTable(dsInstance, table) {
  return dsInstance.open()
    .then(() => testLog.log(`Drop test-table '${table}'.`))
    .then(() => dsInstance.connection())
    .then(client => client.query(`DROP TABLE IF EXISTS ${table} CASCADE;`)
      .finally(() => client.release()));
}

function insertTestRow(dsInstance, table, data) {
  return dsInstance.open()
    .then(() => testLog.log(`Insert test-row in table '${table}'.`))
    .then(() => dsInstance.connection())
    .then(client => client.query(`INSERT INTO ${table} (${Object.keys(data).join(',')}) VALUES (${Object.values(data).join(',')});`)
      .finally(() => client.release()));
}

function selectTestRows(dsInstance, table, details) {
  return dsInstance.open()
    .then(() => testLog.log(`Select test-rows from table '${table}'.`))
    .then(() => dsInstance.connection())
    .then(client => client.query(`SELECT * FROM ${table} ${details};`)
      .finally(() => client.release()));
}

function testInserting(dsInstance) {
  const type = 'for_insert';
  const data = {
    string: 'azaza', number: 12, bool: false, date: new Date(2020, 2, 20, 0, 0, 0, 0)
  };
  return dsInstance.open()
    .then(() => testLog.log('============================================'))
    .then(() => createTestTable(dsInstance, type, [
      'string varchar(40)', 'number integer', 'bool boolean', 'date date'
    ]))
    .then(() => testLog.log('DataSource inserting test.'))
    .then(() => dsInstance.insert(type, data, {skipResult: false, adjustAutoInc: true}))
    .then(res => assert.deepStrictEqual(res, data, 'Check result.'))
    .then(() => selectTestRows(dsInstance, type))
    .then(res => assert.deepStrictEqual(res.rows[0], data, 'Check in database.'))
    .then(() => dropTestTable(dsInstance, type))
    .then(() => testLog.log('DataSource inserting test successfuly completed.'));
}

function testDeleting(dsInstance) {
  const type = 'for_delete';
  return dsInstance.open()
    .then(() => testLog.log('============================================'))
    .then(() => createTestTable(dsInstance, type, ['string varchar(40)']))
    .then(() => insertTestRow(dsInstance, type, {string: '\'azaza\''}))
    .then(() => testLog.log('DataSource deleting test.'))
    .then(() => dsInstance.delete(type, {[Operations.EQUAL]: ['$string', 'azaza']}))
    .then(() => selectTestRows(dsInstance, type))
    .then(res => assert.equal(res.rowCount, 0))
    .then(() => dropTestTable(dsInstance, type))
    .then(() => testLog.log('DataSource deleting test successfuly completed.'));
}

function testUpdating(dsInstance) {
  const type = 'for_update';
  const conditions = {[Operations.EQUAL]: ['$bool', true]};
  const data = {string: 'check', bool: false, number: 4};
  const options = {slipResult: false, bulk: true, adjustAutoInc: true};
  return dsInstance.open()
    .then(() => testLog.log('============================================'))
    .then(() => createTestTable(dsInstance, type, ['string varchar(40)', 'number integer', 'bool boolean']))
    .then(() => insertTestRow(dsInstance, type, {string: '\'azaza\'', number: 1, bool: true}))
    .then(() => insertTestRow(dsInstance, type, {string: '\'ololo\'', number: 2, bool: false}))
    .then(() => insertTestRow(dsInstance, type, {string: '\'ikiki\'', number: 3, bool: true}))

    .then(() => testLog.log('DataSource updating test.'))
    .then(() => dsInstance.update(type, conditions, data, options))
    .then(res => assert.deepStrictEqual(res, [data, data], 'Check result.'))
    .then(() => selectTestRows(dsInstance, type, 'ORDER BY number ASC'))
    .then(res => assert.deepStrictEqual(res.rows, [{string: 'ololo', bool: false, number: 2}, data, data], 'Check in database.'))

    .then(() => dropTestTable(dsInstance, type))
    .then(() => testLog.log('DataSource updating test successfuly completed.'));
}

/**
   * @param {String} type
   * @param {{}} conditions
   * @param {{}} data
   * @param {{}} [options]
   * @param {Boolean} [options.skipResult]
   * @param {Boolean} [options.adjustAutoInc]
   * @returns {Promise}
   */
function testUpserting(dsInstance) {
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
    .then(() => testLog.log('============================================'))
    .then(() => createTestTable(dsInstance, type, ['a varchar(40)', 'b integer', 'c boolean']))
    .then(() => insertTestRow(dsInstance, type, initial))

    .then(() => testLog.log('DataSource upserting test.'))
    .then(() => dsInstance.upsert(type, conditions, data1, options))
    .then(res => assert.deepStrictEqual(res, data1, 'Check insert result.'))
    .then(() => selectTestRows(dsInstance, type, 'ORDER BY b ASC'))
    .then(res => assert.deepStrictEqual(res.rows, expecting1, 'Check insertion in database.')
    )
    .then(() => dsInstance.upsert(type, null, data2, options))
    .then(res => assert.deepStrictEqual(res, expecting2, 'Check update result.'))
    .then(() => selectTestRows(dsInstance, type, 'ORDER BY b ASC'))
    .then(res => assert.deepStrictEqual(res.rows, expecting3, 'Check update in database.'))

    .then(() => dropTestTable(dsInstance, type))
    .then(() => testLog.log('DataSource upserting test successfuly completed.'));
}

function testSelecting(dsInstance) {
  testLog.log('DataSource selecting test.');
}

function testEnsureIndex(dsInstance) {
  const type = 'for_ensure_index';

  return dsInstance.open()
    .then(() => testLog.log('============================================'))
    .then(() => createTestTable(dsInstance, type, ['a varchar(40)', 'b integer']))

    .then(() => testLog.log('DataSource ensure index test.'))
    .then(() => dsInstance.ensureIndex(type, {b: -1}, {unique: true}))
    .then(res => selectTestRows(dsInstance, 'pg_indexes', `WHERE tablename=\'${type}\'`)
      .then(res2 => assert.strictEqual(res, res2.rows[0].indexname, 'Check index in database.'))
      .then(() => insertTestRow(dsInstance, type, {a: '\'azaza\'', b: 0}))
      .then(() => assert.rejects(
        insertTestRow(dsInstance, type, {a: '\'azaza\'', b: 0}),
        {
          table: type,
          constraint: res,
          code: '23505'
        },
        'Check unique violation.'
      )))

    .then(() => dropTestTable(dsInstance, type))
    .then(() => testLog.log('DataSource ensure index test successfuly completed.'));
}

function testEnsureAutoincrement(dsInstance) {
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
    .then(() => testLog.log('============================================'))
    .then(() => createTestTable(dsInstance, type, ['a varchar(40)', 'b integer', 'c integer', 'd integer']))

    .then(() => testLog.log('DataSource ensure autoincrement test.'))
    .then(() => dsInstance.ensureAutoincrement(type, properties))
    .then(res => insertTestRow(dsInstance, type, {
      a: '\'azaza\'',
      b: `nextval('${res.b}')`,
      c: `nextval('${res.c}')`,
      d: `nextval('${res.d}')`})
      .then(() => insertTestRow(dsInstance, type, {
        a: '\'ololo\'',
        b: `nextval('${res.b}')`,
        c: `nextval('${res.c}')`,
        d: `nextval('${res.d}')`}))
      .then(() => insertTestRow(dsInstance, type, {
        a: '\'ikiki\'',
        b: `nextval('${res.b}')`,
        c: `nextval('${res.c}')`,
        d: `nextval('${res.d}')`})))
    .then(() => selectTestRows(dsInstance, type, 'ORDER BY b ASC'))
    .then(res => assert.deepStrictEqual(res.rows, expecting, 'Check autoincremented rows from database.'))

    .then(() => dropTestTable(dsInstance, type))
    .then(() => testLog.log('DataSource ensure index test successfuly completed.'));
}