# Утилиты для кнопок действия
Назад: [Функциональные утилиты приложения](./readme.md) 
  
Утилиты для кнопок действия предназначены для автоматизации выполнения некоторых действий при нажатии кнопки в веб-форме.
Кнопка подключается для веб-формы создания и редактирования объекта через массив `commands` основого объекта формы:
```json
{
  "commands": [
    {
      "id": "SAVE",
      "caption": "Save",
      "visibilityCondition": null,
      "enableCondition": null,
      "needSelectedItem": false,
      "signBefore": false,
      "signAfter": false,
      "isBulk": false
    },
    {
      "id": "SAVEANDCLOSE",
      "caption": "Save and close",
      "visibilityCondition": null,
      "enableCondition": null,
      "needSelectedItem": false,
      "signBefore": false,
      "signAfter": false,
      "isBulk": false
    },
    {
      "id": "CREATE_INDICATOR_VALUE",
      "caption": "Form the collected values",
      "visibilityCondition": null,
      "enableCondition": null,
      "needSelectedItem": false,
      "signBefore": false,
      "signAfter": false,
      "isBulk": false
    }
  ],
```

На этой форме доступно три кнопки: `SAVE`, `SAVEANDCLOSE` и `CREATE_INDICATOR_VALUE`.  
Пользовательские кнопки перед подключением к форме необходимо задать в `deploy.json` в объекте `modules.registry.globals.di.actions.options.actions`:
```json
{
  "modules": {
    "registry": {
      "globals" : {
        "di": {
          "actions": {
            "options": {
              "actions": [
                {
                  "code": "CREATE_INDICATOR_VALUE",
                  "handler": "ion://createIndicatorValueHandler"
                },
                {
                  "code": "ASSIGNMENT_TO_EVENT_ONLY",
                  "handler": "ion://assignmentToEventOnly"
                },
                {
                  "code": "CREATE_PROJECT_REPORTS",
                  "handler": "ion://createProjectReportsHandler"
                }
              ]
```

А также указать параметры используемого кнопкой модуля-обработчика:
```json
{
  "modules": {
    "registry": {
      "globals" : {
        "di": {
          "createIndicatorValueHandler": {
            "module": "applications/sakh-pm/lib/actions/createIndicatorValueHandler",
            "initMethod": "init",
            "initLevel": 2,
            "options": {
              "data": "ion://securedDataRepo",
              "workflows": "ion://workflows",
              "log": "ion://sysLog",
              "changelogFactory": "ion://changelogFactory",
              "state": "onapp"
            }
          },
```

В этом примере нажатие на кнопку `CREATE_INDICATOR_VALUE` запускает скрипт `./applications/sakh-pm/lib/actions/createIndicatorValueHandler.js`.  
  
Содержание скрипта:
```js
/**
 * Created by kras on 08.09.16.
 */
'use strict';

const ActionHandler = require('modules/registry/backend/ActionHandler');
const edit = require('modules/registry/backend/items').saveItem;
const ivc = require('../indicator-value-creator');

/**
 * @constructor
 * @param {{}} options
 * @param {DataRepository} options.data
 * @param {WorkflowProvider} options.workflows
 * @param {Logger} options.log
 * @param {ChangelogFactory} [options.changelogFactory]
 * @param {String} [options.state]
 */
function CreateIndicatorValueHandler(options) {

  options = options || {};

  const work = ivc(options);

  this.init = function () {
    if (options.workflows && options.state) {
      options.workflows.on(
        'indicatorBasic@sakh-pm.' + options.state,
        (e) => {
          let logger = null;
          if (options.changelogFactory && e.user) {
            logger = options.changelogFactory.logger(() => e.user.id());
          }
          return work(e.item, e.user, logger).then(() => null);
        }
      );
    }
  };

  /**
   * @param {{metaRepo: MetaRepository, securedDataRepo: SecuredDataRepository}} scope
   * @param {ChangelogFactory} scope.changelogFactory
   * @param {Request} req
   * @returns {Promise}
   */
  this._exec = function (scope, req) {
    let logger;
    let user = scope.auth.getUser(req);
    if (options.changelogFactory) {
      logger = options.changelogFactory.logger(() => user.id());
    }
    return edit(scope, req, null, logger, true)
      .then(item => scope.dataRepo.getItem(item, null))
      .then((item) => {
        if (item.get('status') !== 'edit') {
          throw new Error('Создать значения показателей, можно только при редактировании!');
        }
        return work(item, user, logger);
      })
      .then((count) => {
        return {$message: 'Создано ' + count + ' значений для ввода по периодам!'};
      });
  };
}

CreateIndicatorValueHandler.prototype = new ActionHandler();

module.exports = CreateIndicatorValueHandler;
``` 