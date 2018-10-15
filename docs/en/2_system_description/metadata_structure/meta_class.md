# Meta class - General part
## JSON
```
{
  "isStruct": false,
  "key": [
    "id"
  ],
  "semantic": "",
  "name": "class_integer",
  "abstract": true,
  "version": "",
  "caption": "Класс \"Целое [6]\"",
  "ancestor": null,
  "container": null,
  "creationTracker": "",
  "changeTracker": "",
  "creatorTracker": "",
  "editorTracker": "",
  "history": 0,
  "journaling": false,  
  "compositeIndexes": null,
  "properties": [...]
}
```
### Field description

| Field                | Name in studio          | Acceptable values                    |  Description                                                                                                                                                                                                 |
|:--------------------:|:-------------------------------:|:--------------------------------------:|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `"isStruct"`        | **It is structure**         | Logical.                            | Если выставлено "true" - это говорит о том, что данный класс является структурой, и может быть использован в прочих классах в атрибутах особого типа - "Структура [16]". [Подробнее](metadata/is-struct) |
| `"key"`              | **Key attributes**           | Array of rows, at least one value.   | Для функционирования приложения в каждом классе должно быть задано ключевое поле, однозначно идентифицирующее объект в коллекции. [Подробнее](metadata/keys)                                             |
| `"semantic"`         | **Semantic attribute**       | Row.                                | Задает семантику - правило формирования строкового представления для данного класса. [Подробнее](metadata/semantic).                                                                                     |
| `"name"`             | **System name**               | Row, only the Latin alphabet, with no spaces. | Задает в том числе первую часть имени файла меты класса, служебное имя.                                                                                                                                  |
| `"abstract"`             | **Criteria of abstraction for class**               | Logical | Используется только для родительских (базовых) классов [Подробнее](metadata/abstract)                                                                                                                                  |
| `"version"`          | **Version**                      | Row in studio.                       | Позволяет задавать версионирвоание меты, для возмжности оперирования данными созданными в разных версиях меты в рамках одной коллекции. [Подробнее](metadata/version)                                    |
| `"caption"`          | **Logical name**              | Row.                                | Отображаемое в пользовательском интерфейсе имя класса                                                                                                                                                    |
| `"ancestor"`         | **Parent class**          | Null or row.                      | Набор атрибутов, заведенных в данном классе, наследуется классами-наследниками. Является способом сократить количество сущностей, когда для них можно использовать одинаковый набор атрибутов. Все классы-наследники будут наследовать атрибутивный состав родителя + можно завести атрибуты, принадлежащие индивидуально данному классу-наследнику (при необходимости)                                                                                                                                                                                        |
| `"container"`        | **Container attribute** | Null or row.                      | **NO DATA**                                                                                                                                                                                           |
| `"creationTracker"`  | **Метка времени создания**      | Row.                                 | Позволяет сохранять в классе дату/время создания объекта, требует наличия соответствующего атрибута класса, `"name"` которого и вносится в данное поле. [Подробнее](metadata/timetrackers)               |
| `"changeTracker"`    | **Time tag of commited changes**     | Row.                                 | Позволяет сохранять в классе дату/время изменения объекта, требует наличия соответствующего атрибута класса, `"name"` которого и вносится в данное поле. [Подробнее](metadata/timetrackers)              |
| `"creatorTracker"`  | **Tag of the user who created the object**      | Row                                 | Позволяет сохранять в классе имя пользователя создавшего объект, требует наличия соответствующего атрибута класса, `"name"` которого и вносится в данное поле. [Подробнее](metadata/usertrackers)               |
| `"editorTracker"`    | **Tag of the user who changed the object**     | Row                                 | Позволяет сохранять в классе имя пользователя, изменившего объект, требует наличия соответствующего атрибута класса, `"name"` которого и вносится в данное поле. [Подробнее](metadata/usertrackers)              |
| `"history"`          | **Data image**               | _0 - no_                              | Stores images of data                                                                                                                                                                               |
|                      |                                 | _1 - arbitrarily_                      |                                                                                                                                                                                                          |
|                      |                                 | _2 - up to an hour_              |                                                                                                                                                                                                          |
|                      |                                 | _3 - up to a day_             |                                                                                                                                                                                                          |
|                      |                                 | _4 - up to a week_            |                                                                                                                                                                                                          |
|                      |                                 | _5 - up to a month_            |                                                                                                                                                                                                          |
|                      |                                 | _6 - up to a year_              |                                                                                                                                                                                                          |
| `"journaling"`       | **Journaling the changes**    | Logical.                            | Разрешает/запрещает журналирование изменений объектов класса. [Подробнее](metadata/journaling)                                                                                                           |
| `"compositeIndexes"` | **Indexation**                  | Null or array of objects.             | Позволяет задать требования уникальности сочетания полей. [Подробнее](metadata/compositeindexes)                                                                                                         |
| `"properties"`       | **Attributes**                    | Array of objects.                       | Массив атрибутов сущности. Каждый объект описывается в соответствии с [атрибутивной частью меты классов](metadata/class-properties)                                                                      |
# MongoDB (registry)
```
{
    "_id" : ObjectId("578f07aa0ce0024ce143e6e8"),
    "isStruct" : false,
    "key" : [ 
        "id"
    ],
    "semantic" : "",
    "name" : "class_integer",
    "version" : "",
    "caption" : "Класс \"Целое [6]\"",
    "ancestor" : null,
    "container" : null,
    "creationTracker" : "",
    "changeTracker" : "",
    "history" : 0,
    "journaling" : false,
    "compositeIndexes" : null,
    "properties" : [...],
    "namespace" : ""
}
```