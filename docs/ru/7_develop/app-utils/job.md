# Утилиты для задач по расписанию
Назад: [Функциональные утилиты приложения](./readme.md) 

Утилиты для задач по расписанию (jobs) предназначены для автоматизации регулярного выполнения некоторых действий через определенные промежутки времени.    
Для этого каждая утилита должна быть определена в deploy.json приложения в объекте globals.jobs, например:
```
{
  "globals": {
    "jobs": {
      "ticketClose": {
        "description": "Ночной перевод билетов в статус \"проверен\"",
          "launch": {
            "timeout": 3600000,
            "hour": 24
          },
          "worker": "ticketCloser",
          "di": {
            "ticketCloser": {
              "executable": "applications/khv-ticket-discount/lib/overnightTicketClose",
              "options": {
                "dataRepo": "ion://dataRepo",
                "log": "ion://sysLog",
                "workflows": "ion://workflows"
...
```
В `di` должно содержаться поле с именем, равном значению `worker` - это задача, которая будет запускаться.  

Здесь по расписанию выполняется скрипт applications/khv-ticket-discount/lib/overnightTicketClose.js.
`launch` может быть объектом, содержащим следующие поля:  
`month`, `week`, `day`, `dayOfYear`, `weekday`, `hour`, `min`, `minute`, `sec`, `second` - задают интервал между выполнениями задачи;  
`check` - интервал проверки условия выполнения, в милисекундах, по умолчанию - 1000.  
Например если `check` равен 5000, а `sec` - 2, задание будет выполняться лишь каждые 10 секунд, когда интервал между проверками совпадет с интервалом выполнения  
Если интервал выполнения задачи не задан, то она будет выполнена при запуске приложения и через каждый интервал проверки.  
`timeout` - время в милисекундах, после которого запущенная задача прерывается по таймауту;  

`launch` также может равняться целому числу - интервалу выполнения задания в милисекундах, при этом задача также будет выполнена сразу при запуске приложения. Таймаут будет установлен равным интервалу выполнения.  

В поле `options` могут быть указаны любые переменные и их значения, которые станут доступны в скрипте через поля объекта, передаваемого как аргумент основной функции модуля.

Скрипт составляется в формате модуля, например так:

```
"use strict";
const Logger = require("core/interfaces/Logger");

module.exports = function (options) {
  return options.dataRepo
    .getList(
      "ticket@khv-ticket-discount",
      "ticketYear@khv-ticket-discount"
    )
    .then((tickets) => {
      let p = Promise.resolve();
      tickets.forEach((ticket) => {
        p = p
          .then(() => options.dataRepo.editItem(ticket.getClassName(), ticket.getItemId(), {"state": "close"}))
          .then(item => (item.name === "ticketYear" ?
            options.workflows.pushToState(item, "ticketYear@khv-ticket-discount", "close") :
            options.workflows.pushToState(item, "ticket@khv-ticket-discount", "close")))
          .catch((err) => {
            if(options.log instanceof Logger) {
              options.log.error(err);
            } else {
              console.error(err);
            }
          });
      });
      return p;
    });
};
```