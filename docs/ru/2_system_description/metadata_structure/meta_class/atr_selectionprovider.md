#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Сортировка выборки допустимых значений](atr_selsorting.md)

# Список выбора допустимых значений

**Список выбора допустимых значений** - находится в атрибутивной части меты класса - ` "selectionProvider"` и задает список выбора допустимых значений для поля ввода атрибута. Список формируется в виде массива объектов типа «ключ-значения» и представляет собой список выбора значения для атрибута с типом «Строка», «Действительное», «Целое», «Десятичное», «Текст».   

Есть три типа списка выбора, тип задается в поле (`"type"`) одной из следующих ключевых фраз: 

* `"SIMPLE"` - список выбора простого типа, 
* `"MATRIX"` - список выбора матричного типа.

## Описание полей структуры

### Структура объекта списка выбора

```
      "selectionProvider": {
        "type": "SIMPLE",
        "list": [...],
        "matrix": [],
        "parameters": [],
        "hq": ""
      },
```

| Поле           | Наименование  | Допустимые значения                                                                                                 | Описание                                             |
|:---------------|:----------------------|:--------------------------------------------------------------------------------------------------------------------|:-----------------------------------------------------|
| `"type"`       | **Тип**               | ` "SIMPLE", "MATRIX", "HQL"`                                                                                        | Тип списка выбора                                    |
| `"list"`       | **Простой тип**       | Массив объектов типа "ключ-значение".                                                                               | Список выбора просто типа ("SIMPLE") хранится здесь. |
| `"matrix"`     | **Матрица**           | Массив векторов, каждый из которых состоит из именования, комплекта условий выбора и комплекта пар "ключ-значение". | Список выбора матричного типа ("MATRIX").            |
| `"parameters"` | **Параметры запроса** | Массив объектов типа "ключ-значение".                                                                               | Параметры запроса, **не реализовано**                |
| `"hq"`         | **Запрос**            | Строка запроса в соответствии с форматом обработчика _не используется в текущей версии_                                                               | Строка запроса, **не реализовано**                   |

### Поле `"list"` - массив объектов следующей структуры

```
        "list": [
          {
            "key": "2001-03-23 09:00:00.000Z",
            "value": "Затопление орбитальной станции «Мир» (23 марта 2001 г. 09:00 мск)"
          },
          {
            "key": "1957-10-04 19:28:00.000Z",
            "value": "Запуск первого в мире искусственного спутника (4 октября 1957 г. в 19:28 гринвич)"
          },
          {
            "key": "1970-04-17 12:07:00.000Z",
            "value": "Завершение полёта «Аполлон-13» (17 апреля 1970 г. 12:07 Хьюстон)"
          }
        ],
```

| Поле      | Наименование  | Допустимые значения                                                                     | Описание                                                         |
|:----------|:----------------------|:----------------------------------------------------------------------------------------|:-----------------------------------------------------------------|
| `"key"`   | **Ключ**              | Любое значение, соответствующее типу атрибута для которого заведен данный список выбора | При сохранении объекта именно значение ключа записывается в базу |
| `"value"` | **Значение**          | Любая строка, могут быть проблемы при наличии управляющих последовательностей           | Значение этого поля выводится в пользовательском интерфейсе      |

### Поле `"matrix"` - массив объектов следующей структуры

```
        "matrix": [
          {
            "comment": "Оба отрицательные",
            "conditions": [
              {
                "property": "matrix_base_1",
                "operation": 5,
                "value": "0",
                "nestedConditions": []
              },
              {
                "property": "matrix_base_2",
                "operation": 5,
                "value": "0",
                "nestedConditions": []
              }
            ],
            "result": [
              {
                "key": "Оба отрицательные",
                "value": "Оба отрицательные"
              }
            ]
          },
          {
            "comment": "Оба неотрицательные",
            "conditions": [
              {
                "property": "matrix_base_1",
                "operation": 8,
                "value": "0",
                "nestedConditions": []
              },
              {
                "property": "matrix_base_2",
                "operation": 8,
                "value": "0",
                "nestedConditions": []
              }
            ],
            "result": [
              {
                "key": "Оба неотрицательные",
                "value": "Оба неотрицательные"
              }
            ]
          },
          {
            "comment": "Первое неотрицательное второе отрицательное",
            "conditions": [
              {
                "property": "matrix_base_1",
                "operation": 8,
                "value": "0",
                "nestedConditions": []
              },
              {
                "property": "matrix_base_2",
                "operation": 5,
                "value": "0",
                "nestedConditions": []
              }
            ],
            "result": [
              {
                "key": "Первое неотрицательное второе отрицательное",
                "value": "Первое неотрицательное второе отрицательное"
              }
            ]
          },
          {
            "comment": "Первое отрицательное, второе неотрицательное",
            "conditions": [
              {
                "property": "matrix_base_1",
                "operation": 5,
                "value": "0",
                "nestedConditions": []
              },
              {
                "property": "matrix_base_2",
                "operation": 8,
                "value": "0",
                "nestedConditions": []
              }
            ],
            "result": [
              {
                "key": "Первое отрицательное, второе неотрицательное",
                "value": "Первое отрицательное, второе неотрицательное"
              }
            ]
          }
        ],
        "parameters": [],
        "hq": ""
      },
```

Каждый объект массива `"MATRIX"` содержит следующие обязательные поля:

| Поле           | Наименование  | Допустимые значения                                 | Описание                                                                                                       |
|:---------------|:----------------------|:----------------------------------------------------|:---------------------------------------------------------------------------------------------------------------|
| `"comment"`    | **Комментарий**       | Любая строка                                        | Комментарий к вектору                                                           |
| `"conditions"` | **Условия**           | Массив объектов                                     | Определяет условия при которых выводится список элементов описанный в  `"result"` данного вектора              |
| `"result"`     | **Результаты**        | Массив объектов, аналогичен структуре поля `"list"` | Задает список выбора, который выводится при соблюдении условий, перечисленных в `"conditions"` данного вектора |


#### Поле `"conditions"` массива `"MATRIX"`

| Поле                 | Наименование         | Допустимые значения                                                   | Описание                                                                                           |
|:---------------------|:-----------------------------|:----------------------------------------------------------------------|:---------------------------------------------------------------------------------------------------|
| `"property"`         | **Атрибут**                  | Строка, только латиница без пробелов                                  | Атрибут класса, значение поля которого проверяется на соответствие данному условию данного вектора |
| `"operation"`        | **Операция**                 | Код операции                                                          | Операция, согласно которой производится определение                                                |
|                      |                              | _0 - равно (И)_                                                       |                                                                                                    |
|                      |                              | _1 - не равно (ИЛИ)_                                                  |                                                                                                    |
|                      |                              | _2 - пусто (НЕ)_                                                      |                                                                                                    |
|                      |                              | _3 - не пусто (МИН ИЗ)_                                               |                                                                                                    |
|                      |                              | _4 - (МАКС ИЗ)_                                                       |                                                                                                    |
|                      |                              | _5 - < ()_                                                            |                                                                                                    |
|                      |                              | _6 - >_                                                               |                                                                                                    |
|                      |                              | _7 - <=_                                                              |                                                                                                    |
|                      |                              | _8 - >=_                                                              |                                                                                                    |
|                      |                              | _9 - IN /Похож/_                                                                   |                                                                                                    |
|                      |                              | _10 - содержит_                                                       |                                                                                                    |
| `"value"`            | **Значение**                 | Зависит от типа операции                                              | Второе значение для бинарных операций                                                              |
| `"nestedConditions"` | **Вложенные условия отбора** | Объект, структура аналогична структуре самого объекта условий отбора. |                                                                                                    |

_**NB**: Код операции соответствует разным значениям операций, в зависимостри от того, выбран атрибут или нет. Если поле  `"property"` равно `null`, то кодируется логическое условие, по которому объединяются вложенные условия отбора. (Указаны в скобках в таблице выше)_

## Описание

### Список выбора типа "SIMPLE"

Данный список выбора позволяет создать жестко зашитый в приложении пресет значений поля, ограничив тем самом выбор пользователя.  
Для поля в обязательном порядке следует задать тип представления - "Выпадающий список [5]".  
Подразумевает возможность сохранять данные в базе в типе, отличном от типа данных, выводимых пользователю.  
_Например_: Если задать в качестве полей `key` элементы списка выбора значения даты-времени в ISODate, а в качестве `value` - описание события, то предоставим пользвателю возможность выбрать событие, но внутри приложения работать с данными типа ISODate.

_**NB**: Если у атрибута со списком выбора разрешено пустое значение: `"nullable": true` - в списке выбора добавляется пустое значение по умолчанию!_

```
    {
      "orderNumber": 50,
      "name": "sp_date",
      "caption": "Сохраняем ключ дата-время",
      "type": 9,
      "size": null,
      "decimals": 0,
      "allowedFileTypes": null,
      "maxFileCount": 0,
      "nullable": true,
      "readonly": false,
      "indexed": false,
      "unique": false,
      "autoassigned": false,
      "hint": null,
      "defaultValue": null,
      "refClass": "",
      "itemsClass": "",
      "backRef": "",
      "backColl": "",
      "binding": "",
      "semantic": null,
      "selConditions": [],
      "selSorting": [],
      "selectionProvider": {
        "type": "SIMPLE",
        "list": [
          {
            "key": "2001-03-23T09:00:00.000Z",
            "value": "Затопление орбитальной станции «Мир» (23 марта 2001 г. 09:00 мск)"
          },
          {
            "key": "1957-10-04T19:28:00.000Z",
            "value": "Запуск первого в мире искусственного спутника (4 октября 1957 г. в 19:28 гринвич)"
          },
          {
            "key": "1970-04-17T12:07:00.000Z",
            "value": "Завершение полёта «Аполлон-13» (17 апреля 1970 г. 12:07 Хьюстон)"
          }
        ],
        "matrix": [],
        "parameters": [],
        "hq": ""
      },
      "indexSearch": false,
      "eagerLoading": false,
      "formula": null
    }
```

#### Принцип создания:
Необходимо:
1. выбрать исходя из требований предметной области наиболее удобный тип атрибута,
2. выбрать идентификаторы данного типа (`"key"`) с той целью, что бы при необходимости автоматизированной обработки оперировать значениями в базе максимально эффективно,
3. задать к каждому идентификатору подпись, которая будет отображаться в интерфейсе `"value"`,
4. задать в представлениях тип представления - "Выпадающий список [5]" в обязательном порядке.

### Список выбора типа "MATRIX"  

В матрицах результирующий список выбора это все, что попадает под условия. Если условий нет - то система считает, что список выбора применяется всегда.
Для предсказуемости работы приложения, необходимо чтобы были соблюдены два условия:

1. Вектора не должны перекрывать друг друга.
2. Массив значений опорного атрибута, как основание матрицы (массив сочетаний значений опорных атрибутов) должен полностью закрываться описанными векторами.

 Система берет значение опорного поля (полей) и последовательно применяет к нему условия описанные в векторах. Каждый вектор - это набор условий и собственный список выбора. Как только система дойдет до вектора, условиям которого удовлетворяет значение опорного поля, она берет из него список выбора и определяет к выводу в пользовательском интерфейсе. Подразумевается, что на любое значение опорного поля система найдет соответствующий вектор.  



#### Пример 1: Матрица от двух целочисленных значений

**JSON класса**:

```
{
  "isStruct": false,
  "key": [
    "id"
  ],
  "semantic": "",
  "name": "selection_provider_matrix_dc",
  "version": "",
  "caption": "\"MATRIX\" от двух оснований",
  "ancestor": null,
  "container": null,
  "creationTracker": "",
  "changeTracker": "",
  "history": 0,
  "journaling": false,
  "compositeIndexes": [],
  "properties": [
    {
      "orderNumber": 10,
      "name": "id",
      "caption": "Идентификатор",
      "type": 12,
      "size": null,
      "decimals": 0,
      "allowedFileTypes": null,
      "maxFileCount": 0,
      "nullable": false,
      "readonly": false,
      "indexed": false,
      "unique": true,
      "autoassigned": true,
      "hint": null,
      "defaultValue": null,
      "refClass": "",
      "itemsClass": "",
      "backRef": "",
      "backColl": "",
      "binding": "",
      "semantic": null,
      "selConditions": [],
      "selSorting": [],
      "selectionProvider": null,
      "indexSearch": false,
      "eagerLoading": false,
      "formula": null
    },
    {
      "orderNumber": 20,
      "name": "matrix_base_1",
      "caption": "Первое целое основание матрицы",
      "type": 6,
      "size": null,
      "decimals": 0,
      "allowedFileTypes": null,
      "maxFileCount": 0,
      "nullable": true,
      "readonly": false,
      "indexed": false,
      "unique": false,
      "autoassigned": false,
      "hint": null,
      "defaultValue": null,
      "refClass": "",
      "itemsClass": "",
      "backRef": "",
      "backColl": "",
      "binding": "",
      "semantic": null,
      "selConditions": [],
      "selSorting": [],
      "selectionProvider": null,
      "indexSearch": false,
      "eagerLoading": false,
      "formula": null
    },
    {
      "orderNumber": 30,
      "name": "matrix_base_2",
      "caption": "Второе целое основание матрицы",
      "type": 6,
      "size": null,
      "decimals": 0,
      "allowedFileTypes": null,
      "maxFileCount": 0,
      "nullable": true,
      "readonly": false,
      "indexed": false,
      "unique": false,
      "autoassigned": false,
      "hint": null,
      "defaultValue": null,
      "refClass": "",
      "itemsClass": "",
      "backRef": "",
      "backColl": "",
      "binding": "",
      "semantic": null,
      "selConditions": [],
      "selSorting": [],
      "selectionProvider": null,
      "indexSearch": false,
      "eagerLoading": false,
      "formula": null
    },
    {
      "orderNumber": 40,
      "name": "selection_provider_matrix",
      "caption": "Список выбора типа \"MATRIX\"",
      "type": 0,
      "size": null,
      "decimals": 0,
      "allowedFileTypes": null,
      "maxFileCount": 0,
      "nullable": true,
      "readonly": false,
      "indexed": false,
      "unique": false,
      "autoassigned": false,
      "hint": null,
      "defaultValue": null,
      "refClass": "",
      "itemsClass": "",
      "backRef": "",
      "backColl": "",
      "binding": "",
      "semantic": null,
      "selConditions": [],
      "selSorting": [],
      "selectionProvider": {
        "type": "MATRIX",
        "list": [],
        "matrix": [
          {
            "comment": "Оба отрицательные",
            "conditions": [
              {
                "property": "matrix_base_1",
                "operation": 5,
                "value": "0",
                "nestedConditions": []
              },
              {
                "property": "matrix_base_2",
                "operation": 5,
                "value": "0",
                "nestedConditions": []
              }
            ],
            "result": [
              {
                "key": "Оба отрицательные",
                "value": "Оба отрицательные"
              }
            ]
          },
          {
            "comment": "Оба неотрицательные",
            "conditions": [
              {
                "property": "matrix_base_1",
                "operation": 8,
                "value": "0",
                "nestedConditions": []
              },
              {
                "property": "matrix_base_2",
                "operation": 8,
                "value": "0",
                "nestedConditions": []
              }
            ],
            "result": [
              {
                "key": "Оба неотрицательные",
                "value": "Оба неотрицательные"
              }
            ]
          },
          {
            "comment": "Первое неотрицательное второе отрицательное",
            "conditions": [
              {
                "property": "matrix_base_1",
                "operation": 8,
                "value": "0",
                "nestedConditions": []
              },
              {
                "property": "matrix_base_2",
                "operation": 5,
                "value": "0",
                "nestedConditions": []
              }
            ],
            "result": [
              {
                "key": "Первое неотрицательное второе отрицательное",
                "value": "Первое неотрицательное второе отрицательное"
              }
            ]
          },
          {
            "comment": "Первое отрицательное, второе неотрицательное",
            "conditions": [
              {
                "property": "matrix_base_1",
                "operation": 5,
                "value": "0",
                "nestedConditions": []
              },
              {
                "property": "matrix_base_2",
                "operation": 8,
                "value": "0",
                "nestedConditions": []
              }
            ],
            "result": [
              {
                "key": "Первое отрицательное, второе неотрицательное",
                "value": "Первое отрицательное, второе неотрицательное"
              }
            ]
          }
        ],
        "parameters": [],
        "hq": ""
      },
      "indexSearch": false,
      "eagerLoading": false,
      "formula": null
    }
  ]
}
```

### Порядок разработки  

Необходимо разделить все возможные сочетания пар атрибутов `"matrix_base_1"` и `"matrix_base_2"` на 4 вектора. Делить необходимо относительно нуля, то есть каждое поле может быть либо отрицательным, либо неотрицательным. Ниже представлена схема:

![Разбиваем на вектора](/docs/ru/images/sel_provider.jpg)


Выписываем векторы и их условия:

1. Оба отрицательные: (matrix_base_1 < 0) && (matrix_base_2 < 0)
2. Оба неотрицательные: (matrix_base_1 >= 0) && (matrix_base_2 >= 0)
3. Первое неотрицательное второе отрицательное: (matrix_base_1 >= 0) && (matrix_base_2 < 0)
4. Первое отрицательное, второе неотрицательное: (matrix_base_1 < 0) && (matrix_base_2 >= 0)
5. 
Если в 3 и 4 условиях неверно указать равенство нулю, то как результат - выпадающие элементы и перекрытие векторов.  

В примере выше для каждого вектора список выбора ограничен одним пунктом, но их может быть больше.

#### Пример 2: Матрица от свободного действительного значения со сложными условиями
```
{
  "isStruct": false,
  "metaVersion": "2.0.7",
  "key": [
    "id"
  ],
  "semantic": "",
  "name": "selection_provider_matrix_real",
  "version": "",
  "caption": "\"MATRIX\" с векторами \u003c, \u003e, \u003c\u003d, \u003e\u003d, \u003d от действительного",
  "ancestor": null,
  "container": null,
  "creationTracker": "",
  "changeTracker": "",
  "history": 0,
  "journaling": false,
  "compositeIndexes": null,
  "properties": [
    {
      "orderNumber": 10,
      "name": "id",
      "caption": "Идентификатор",
      "type": 12,
      "size": null,
      "decimals": 0,
      "allowedFileTypes": null,
      "maxFileCount": 0,
      "nullable": false,
      "readonly": false,
      "indexed": false,
      "unique": true,
      "autoassigned": true,
      "hint": null,
      "defaultValue": null,
      "refClass": "",
      "itemsClass": "",
      "backRef": "",
      "backColl": "",
      "binding": "",
      "semantic": null,
      "selConditions": [],
      "selSorting": [],
      "selectionProvider": null,
      "indexSearch": false,
      "eagerLoading": false,
      "formula": null
    },
    {
      "orderNumber": 20,
      "name": "matrix_base",
      "caption": "Действительное основание для списка выбора матричного типа",
      "type": 7,
      "size": null,
      "decimals": 0,
      "allowedFileTypes": null,
      "maxFileCount": 0,
      "nullable": true,
      "readonly": false,
      "indexed": false,
      "unique": false,
      "autoassigned": false,
      "hint": null,
      "defaultValue": null,
      "refClass": "",
      "itemsClass": "",
      "backRef": "",
      "backColl": "",
      "binding": "",
      "semantic": null,
      "selConditions": [],
      "selSorting": [],
      "selectionProvider": null,
      "indexSearch": false,
      "eagerLoading": false,
      "formula": null
    },
    {
      "orderNumber": 30,
      "name": "selection_provider_matrix",
      "caption": "Список выбора со сложными условиями",
      "type": 6,
      "size": null,
      "decimals": 0,
      "allowedFileTypes": null,
      "maxFileCount": 0,
      "nullable": false,
      "readonly": false,
      "indexed": false,
      "unique": false,
      "autoassigned": false,
      "hint": null,
      "defaultValue": null,
      "refClass": "",
      "itemsClass": "",
      "backRef": "",
      "backColl": "",
      "binding": "",
      "semantic": null,
      "selConditions": [],
      "selSorting": [],
      "selectionProvider": {
        "type": "MATRIX",
        "list": [],
        "matrix": [
          {
            "comment": "matrix_base \u003c 3",
            "conditions": [
              {
                "property": "matrix_base",
                "operation": 5,
                "value": [
                  "3"
                ],
                "nestedConditions": []
              }
            ],
            "result": [
              {
                "key": "1",
                "value": "Сохраним 1 при основании меньше 3"
              },
              {
                "key": "2",
                "value": "Сохраним 2 при основании меньше 3"
              }
            ]
          },
          {
            "comment": "matrix_base \u003d 3",
            "conditions": [
              {
                "property": "matrix_base",
                "operation": 0,
                "value": [
                  "3"
                ],
                "nestedConditions": []
              }
            ],
            "result": [
              {
                "key": "3",
                "value": "Сохраним 3 при основании 3"
              }
            ]
          },
          {
            "comment": "matrix_base \u003e 3 и matrix_base \u003c\u003d 15",
            "conditions": [
              {
                "property": "matrix_base",
                "operation": 6,
                "value": [
                  "3"
                ],
                "nestedConditions": []
              },
              {
                "property": "matrix_base",
                "operation": 7,
                "value": [
                  "15"
                ],
                "nestedConditions": []
              }
            ],
            "result": [
              {
                "key": "5",
                "value": "Сохраним 5 при основании \u003e 3 и \u003c\u003d 15"
              },
              {
                "key": "10",
                "value": "Сохраним 10 при основании \u003e 3 и \u003c\u003d 15"
              },
              {
                "key": "15",
                "value": "Сохраним 15 при основании \u003e 3 и \u003c\u003d 15"
              }
            ]
          },
          {
            "comment": "matrix_base \u003e\u003d16",
            "conditions": [
              {
                "property": "matrix_base",
                "operation": 8,
                "value": [
                  "16"
                ],
                "nestedConditions": []
              }
            ],
            "result": [
              {
                "key": "50",
                "value": "Сохраним 50 при основании \u003e\u003d 16"
              },
              {
                "key": "100",
                "value": "Сохраним 100 при основании \u003e\u003d16"
              },
              {
                "key": "1000",
                "value": "Сохраним 1000 при основании \u003e\u003d16"
              },
              {
                "key": "5000",
                "value": "Сохраним 5000 при основании \u003e\u003d16"
              }
            ]
          },
          {
            "comment": "matrix_base \u003e 15 и matrix_base \u003c 16",
            "conditions": [
              {
                "property": "matrix_base",
                "operation": 6,
                "value": [
                  "15"
                ],
                "nestedConditions": []
              },
              {
                "property": "matrix_base",
                "operation": 5,
                "value": [
                  "16"
                ],
                "nestedConditions": []
              }
            ],
            "result": [
              {
                "key": "0",
                "value": "Сохраним 0, если основание где-то между 15 и 16"
              }
            ]
          }
        ],
        "parameters": [],
        "hq": ""
      },
      "indexSearch": false,
      "eagerLoading": false,
      "formula": null
    }
  ]
}
```

**Векторы и их условия**:

1. matrix_base < 3 
2. matrix_base = 3
3. (matrix_base > 3) && (matrix_base <= 15)
4. matrix_base >= 16  
5. (matrix_base > 15) && (matrix_base < 16)




### Следующая страница: [Предварительная выборка](eager_loading.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_class/atr_selectionprovider.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>         



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.   
All rights reserved. 