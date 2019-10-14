#### [Оглавление](/docs/ru/index.md)

### Назад: [Модули](modules.md)

# Модуль "Registry"

**Модуль регистра (registry)** – ключевой модуль предназначенный непосредственно для работы с данными на основе структур метаданных – в том числе по ведению проектов, программ, мероприятий и др.

## Настройка

* [DI (treegridController)](registry_treegrid.md)

### Deploy

### Настройка частоты опроса в deploy.json

Настройка частоты опроса сервера, что объект не заблокирован в deploy.json:

```
"registry": {
   "globals": {
      "notificationCheckInterval": 60000 // раз в минуту
   }
}
```

### Настройка createByCopy

Настройка отображения кнопки "Создать еще" в deploy.json:

```
"createByCopy": [
          "person@khv-childzem" // класс
        ],
```

## Фильтры

Подробнее о фильтрах [здесь](/docs/ru/2_system_description/functionality/filter.md).

### Настройка помощь по фильтрам

Справка размещается в файле шаблона `modules/registry/view/default/templates/view/list-filter-helper.ejs`

## Требования к коду

Cтиль написания компонентов фронт-енда [здесь](registry_code.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE)&ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/docs/en/3_modules_description/registry.md) &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>         



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV".**   
All rights reserved.  