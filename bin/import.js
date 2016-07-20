/**
 * Created by kras on 10.07.16.
 */
var worker = require('lib/import');
var config = require('config');
var DataSources = require('core/datasources');
var DbSync = require('core/impl/meta/mongo/dbSync');
var MetaRepository = require('core/impl/meta/DsMetaRepository');
var DataRepository = require('core/impl/datarepository/ionDataRepository');
var KeyProvider = require('core/impl/meta/keyProvider');

var src = '../in';
var ns = '';

var setSrc = false;
var setNamespace = false;

process.argv.forEach(function (val) {
  if (val === '--src') {
    setSrc = true;
    setNamespace = false;
    return;
  } else if (val === '--ns') {
    setNamespace = true;
    setSrc = false;
    return;
  } else if (setSrc) {
    src = val;
  } else if (setNamespace) {
    ns = val;
  }
  setSrc = false;
  setNamespace = false;
});

var dataSources = new DataSources(config);

var metaDs = dataSources.get(config.metaDs);
if (!metaDs) {
  throw 'Не указан источник данных мета-репозитория!';
}

var dataDs = dataSources.get(config.dataDs);
if (!dataDs) {
  throw 'Не указан источник данных репозитория объектов!';
}

dataSources.connect().then(function () {
  var metaRepo = new MetaRepository({Datasource: metaDs});
  var keyProvider = new KeyProvider(metaRepo, dataDs.connection());
  var dataRepo = new DataRepository(dataDs, metaRepo, keyProvider);
  var sync = new DbSync(metaDs.connection(), {});
  return worker(src, sync, metaRepo, dataRepo, {namespace: ns});
}).then(function () {
  console.info('Импорт выполнен успешно.');
  process.exit(0);
}).catch(function (err) {
  console.error(err);
  process.exit(130);
});
