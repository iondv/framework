#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Условие обязательности](/docs/ru/2_system_description/metadata_structure/meta_view/obligation.md) 

# Валидаторы

**Валидаторы** - проверяют введенные в поле атрибута значения. Задаются в представлениях класса.

### Пример:

```
{
  "tabs": [
    {
      "caption": "Информационная система",
      "fullFields": [
        {
          "caption": "Уникальный идентификационный номер ОУ",
          "type": 1,
          "property": "OuId",
          "size": 2,
          "maskName": null,
          "mask": null,
          "mode": null,
          "fields": [],
          "columns": [],
          "actions": 7,
          "orderNumber": 0,
          "required": false,
          "visibility": null,
          "enablement": null,
          "obligation": null,
          "readonly": false,
          "selectionPaginated": true,
          "validators": "___testValid"
        },
```
Валидторы хранятся в папке /validators, например файл `___testValid.valid.json`:

```
{
  "name": "___testValid",
  "caption": "___testValid",
  "assignByContainer": true,
  "validationExpression": "viewValue == «ninja»",
  "mask": "aaaaa"
}
```
Значение атрибутов:

* `"name"` - код валидатора, указывается в поле validators - представления
* `"caption"` - заголовок валидатора
* `"assignByContainer"` - автозаполнять из поля контейнера - Если выставлен данный флаг (true), то поле которому назначен валидатор, будет автоматически заполнено значением из поля с таким же валидатором, привязанного к атрибуту объекта, который является контейнером по отношению к редактируемому объекту.
* `"validationExpression"` - выражение для вычисления и проверки
* `"mask"` - маска в соответствии с [описанием настройки масок](/docs/ru/2_system_description/metadata_structure/meta_view/mask.md)

Необходима следующая реализация выражение для вычисления (validationExpression ) - как Javascript выражения задающее логику проверки введенного значения. При этом доступны переменные modelValue и viewValue, представляющие соответственно старое и новое значение поля.   
Пример выражения:   
viewValue == «ninja»   
Возможно использование регулярных выражений (regExp) и обращение к другим атрибутам редактируемого объекта по аналогии с выражениями для условий видимости и активности полей 

_Выдернуто из_: https://ion-dv.atlassian.net/browse/MODREGISTR-27

### Следующая страница: [Теги](/docs/ru/2_system_description/metadata_structure/meta_view/tags.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_view/validators.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 