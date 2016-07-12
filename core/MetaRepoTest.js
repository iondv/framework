/**
 * Created by Vasiliy Ermilov (email: inkz@xakep.ru, telegram: @inkz1) on 08.04.16.
 */

var MetaRepo = require('core/impl/meta/dsMetaRepository');
var Datasources = require('core/datasources');

var dataSources = new Datasources({
  datasources: [
    {
      name: 'Db',
      module: 'core/impl/datasource/mongodb',
      config: {
        uri: 'mongodb://127.0.0.1:27017/ion',
        options: {
          server: {
            socketOptions: {
              keepAlive: 1
            }
          }
        },
        connectionLimit: 10,
        schema: 'ion',
        user: 'root',
        password: 'ION-sql1'
      }
    }
  ],
  metadata: {
    MenuTableName: 'ion_menu'
  }
});

var meta = new MetaRepo({
  Datasource: dataSources.get('Db')
});

var assert = require('assert');
describe('запускаем мета репозиторий', function () {
    it('метод: getMeta', function (done) {
      meta.getMeta('ion_filter').then(function (classMeta) {
        console.log('rap');
        assert.notEqual(null, classMeta);
        assert.equal(1, 2);
        done();
      });
    });
  });
