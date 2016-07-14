/**
 * Created by kras on 13.07.16.
 */
var worker = require('lib/export');
var config = require('config');
var DataSources = require('core/datasources');
var MetaRepository = require('core/impl/meta/DsMetaRepository');
var DataRepository = require('core/impl/datarepository/ionDataRepository');
var KeyProvider = require('core/impl/meta/mongo/keyProvider');

var dst = '../out';
var version = '';
var ns = '';

var setDst = false;
var setVer = false;
var setNamespace = false;

process.argv.forEach(function (val) {
  if (val === '--dst') {
    setDst = true;
    setVer = false;
    setNamespace = false;
    return;
  } else if (val === '--ns') {
    setDst = false;
    setVer = false;
    setNamespace = true;
    return;
  } else if (val === '--ver') {
    setDst = false;
    setVer = true;
    setNamespace = false;
    return;
  } else if (setDst) {
    dst = val;
  } else if (setVer) {
    version = val;
  } else if (setNamespace) {
    ns = val;
  }
  setDst = false;
  setVer = false;
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
  return worker(
    dst,
    metaRepo,
    dataRepo,
    {
      namespace: ns,
      version: version
    });
}).then(function () {
  console.info('Экспорт выполнен успешно.');
  process.exit(0);
}).catch(function (err) {
  console.error(err);
  process.exit(130);
});
