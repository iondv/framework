#### [Content](/docs/en/index.md)

### The previous: [Meta navigation](/docs/en/2_system_description/metadata_structure/meta_view/meta_navigation.md)

# Meta work-flow

## Description

**Work-flow** - это четкая последовательность действий, которую выполняют для получения заданного результата. Как правило, процесс многократно повторяется. Применение бизнес-процесса позволяет отображать стадии выполняемого процесса и задавать условия для его выполнения.

## Формат бизнес-процесса

### JSON

```
{
  "name": "basic",
  "caption": "Поручения",
  "wfClass": "basic",
  "startState": "new",
  "states": [],
  "transitions": [],
  "metaVersion": "2.0.61"
}
```

## Описание полей

| Поле | Наименование |Описание  |
|:-----|:-------|:-----------|
|`"name"`| Системное имя  | Системное имя бизнес-процесса|
|`"caption"`| Логическое имя   |логическое имя бизнес-процесса|
|`"wfClass"`| Класс БП | Класс, к которому применяется бизнес-процесс|
|`"startState"`| Статус   | Статус, присвоенный началу бизнес-процесса|
|`"states"`|  [Список статусов](/docs/ru/2_system_description/metadata_structure/meta_workflows/status_wf.md) | Список статусов бизнес-процесса. |
|`"transitions"`|  [Переходы](/docs/ru/2_system_description/metadata_structure/meta_workflows/transitions_wf.md)  | Переходы между статусами для бизнес-процесса. |
|`"metaVersion"`|  Версионирование | Версия метаданных.

## Условие "contains" ("содержит")

Учтите, что чтобы в БП работал contains, коллекция должна грузиться жадно. Иначе в коллекции будет пусто, и результат будет всегда false. Условия применяются к объекту извлеченному из БД, дополнительных запросов не делается.

### Пример

```
          {
              "property": "charge",
              "operation": 10,
              "value": null,
              "nestedConditions": [
                {
                  "property": "state",
                  "operation": 1,
                  "value": [
                    "close"
                  ],
                  "nestedConditions": []
                }
              ]
            }
```

## Настройка подсказок при переходе по статусу БП

Представляет собой вывод инструкции в отдельном модальном окне с кнопками - "продолжить" или "отменить". Чтобы понимали что они делают. Ну и при наведении на кнопку - всплывающий хинт.

### Пример

```json
"transitions": [
    {
      ...
      "confirm": true,
      "confirmMessage": null
    }
```

* `"confirm"` - подтверждение действия на переходе (+ стандартный вывод текста - вы действительно хотите выполнить действие "name")

* `"confirmMessage"` -  пишем уникальный текст для вывода в подтверждении в замен стандартного

### Следующая страница: [Статусы бизнес-процесса](/docs/ru/2_system_description/metadata_structure/meta_workflows/status_wf.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_workflows/meta_workflows.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 