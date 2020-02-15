# Утилиты для веб-сервиса (rest)
Назад: [Функциональные утилиты приложения](./readme.md)  

Утилиты веб-сервиса предназначены для реализации обработки различных видов запросов к серверу.  
Cервис подключается к приложению в deploy.json в объекте modules.rest.globals.di, например так:
```
{
  "modules": {
    "rest": {
      "globals": {
        "di": {
          "acceptor": {
            "module": "modules/rest/lib/impl/acceptor",
            "options": {
              "dataRepo": "ion://dataRepo",
              "metaRepo": "ion://metaRepo"
...
```
В этом случае подключается сервис `acceptor`, он станет доступен для запросов по url `https://dnt.iondv.com/rest/acceptor`.  
Функциональное описание взаимодействия с запросами должно содержаться в скрипте `modules/rest/lib/impl/acceptor.js`.  
В поле `options` могут быть указаны любые переменные и их значения, которые станут доступны в скрипте через поля объекта, передаваемого как аргумент основной функции модуля.

Скрипт составляется в формате модуля, например так:

```
const Service = require('modules/rest/lib/interfaces/Service');

/** Simple app service - REST module
 * @param {{dataRepo: DataRepository, metaRepo: MetaRepository}} options
 * @constructor
 */
function EchoRest(options) {
  this._route = function(router) {
    this.addHandler(router, '/', 'POST', (req) => {
      return Promise.resolve({
        echo: 'peekaboo'
      });
    });
    this.addHandler(router, '/', 'GET', (req) => {
      return Promise.resolve({
        echo: 'peekaboo'
      });
    });
  };
}
EchoRest.prototype = new Service();
module.exports = EchoRest;
```

Подробное описание принципов создания сервиса можно найти в https://github.com/iondv/rest/blob/master/README_RU.md `#### Разработка обработчика сервиса в приложении`