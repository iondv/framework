# Утилиты для бизнес-процесса
Назад: [Функциональные утилиты приложения](./readme.md) 
  
Утилиты для бизнес-процесса предназначены для автоматизации выполнения некоторых действий при изменении статуса бизнес процесса.
Утилита подключается к приложению в deploy.json в объекте globals.plugins, например так:
```
{
  "globals": {
    "plugins": {
      "wfEvents": {
        "module": "applications/sakh-pm/lib/wfEvents",
        "initMethod": "init",
        "initLevel": 1,
        "options": {
          "workflows": "ion://workflows",
          "metaRepo": "ion://metaRepo",
          "dataRepo": "ion://dataRepo",
          "log": "ion://sysLog",
          "AIPConfigPath": "applications/sakh-pm/paths_config/eventOnlyAIP.json"
```

Здесь подключается утилита `wfEvents`. Скрипт, содержащий описание действий при изменении статуса бизнес-процесса находится по пути `applications/sakh-pm/lib/wfEvents.js`.    
В поле `options` могут быть указаны любые переменные и их значения, которые станут доступны в скрипте через поля объекта, передаваемого как аргумент основной функции модуля.

Скрипт составляется в формате модуля, при условии, что он должен включать метод init, например так:

```
'use strict';
const ivc = require('./indicator-value-creator');

function WorkflowEvents(options) {
  this.init = function () {
    options.workflows.on(
      ['assignmentBasic@sakh-pm.fin'],
      (e) => {
        if (e.transition === 'toKT') {
          return options.dataRepo.getItem(e.item, null, {forceEnrichment: [['meeting','basicObj'],['basicObj']]})
            .then((item) => {
              const data = {
                basicObj: item.property('meeting.basicObj').evaluate() || item.property('basicObj').evaluate(),
                name: item.get('name'),
                owner: item.get('owner'),
                datePlannedEnd: e.item.get('datePlannedEnd'),
                priority: e.item.get('priority'),
                descript: e.item.get('descript')
              };
              return options.dataRepo.createItem('eventControl@sakh-pm', data, null, {user: e.user});
            });
        }
        return Promise.resolve();
      }
    );
    options.workflows.on(
      ['proposal@sakh-pm.cancel'],
      (e) => {
        if (e.transition === 'curatorToCancel') {
          return options.dataRepo.editItem(e.item.getMetaClass().getCanonicalName(), e.item.getItemId(), {archive: true})
            .then(
              item => collectionToArchive(item, 'proposals')
                .then(() => collectionToArchive(item, 'eventBlock'))
                .then(() => collectionToArchive(item, 'project'))
            );
        }
        return Promise.resolve();
      }
    );
  };
}

module.exports = WorkflowEvents;
```

В этом скрипте описаны действия, которые нужно выполнить при изменении статуса у бизнес-процесса `assignmentBasic@sakh-pm` на `fin`, и у бизнес-процесса `proposal@sakh-pm` на `cancel`.