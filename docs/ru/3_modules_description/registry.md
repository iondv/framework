#### [Оглавление](/docs/ru/index.md)

### Назад: [Модули](/docs/ru/3_modules_description/modules.md)

# Модуль "Registry"

**Модуль регистра (registry)** – ключевой модуль предназначенный непосредственно для работы с данными на основе структур метаданных – в том числе по ведению проектов, программ, мероприятий и др.

## Настройка

* [DI (treegridController)](/docs/ru/3_modules_description/registry_treegrid.md)

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

Cтиль написания компонентов фронт-енда [здесь](/docs/ru/3_modules_description/registry_code.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md)&ensp;  [Contact us](https://iondv.ru/index.html) &ensp;  [English](/docs/en/3_modules_description/registry.md) &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV".**   
All rights reserved.  