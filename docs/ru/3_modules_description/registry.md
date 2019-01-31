#### [Оглавление](/docs/ru/index.md)

### Назад: [Модули](/docs/ru/3_modules_description/modules.md)

# Модуль "Registry"

**Модуль регистра (registry)** – ключевой модуль предназначенный непосредственно для работы с данными на основе структур метаданных – в том числе по ведению проектов, программ, мероприятий и др.

## Настройка

* [DI (treegridController)](./di)

### Deploy

### Настройка частоты опроса сервера, что объект не заблокирован в deploy.json:
Источник https://ion-dv.atlassian.net/browse/MODREGISTR-481

```
"registry": {
   "globals": {
      "notificationCheckInterval": 60000 // раз в минуту
   }
}
```

### Настройка отображения кнопки "Создать еще" в deploy.json:
Источник https://ion-dv.atlassian.net/browse/MODREGISTR-475

```
"createByCopy": [
          "person@khv-childzem" // класс
        ],
```

## Фильтры
### Настройка помощь по фильтрам
Реализация в [MODREGISTR-493](https://ion-dv.atlassian.net/browse/MODREGISTR-493)
Помощь размещается в файле шаблона
`modules/registry/view/default/templates/view/list-filter-helper.ejs`

## Версии (последующее включение в карту проверки и документации)

* [Версии](./Version)

* [Карта проверки](./CheckCard)

## Frontend
[Логика формирования id элементов в верстке страниц](frontend/element-ids)

## Требования к коду

[Cтиль написания компонентов фронт-енда](requirements/frontend-style)

## Требования к коду

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md)&ensp;  [Contact us](https://iondv.ru/index.html) &ensp;  
[English](/docs/en/3_modules_description/registry.md) &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 LLC "ION DV".
All rights reserved.