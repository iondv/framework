#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Теги](tags.md)

# Опции 

**Опции** - предназначены для установления дополнительных параметров атрибута. Интерпретация настроек выполняется конкретной специфической реализацией модуля.

На данный момент в модуле `registry` поддерживаются следующие настройки:
```
"options": {
   "cssClasses": ["class1", "class2"],
   "cssStyles": {
       "background-color": "#FF0000"
    },
    "template": "some-custom-template"
}
```
* `cssClasses` - классы css, которые нужно применить к полю (в стандартном шаблоне)
* `cssStyles` - css стили, которые нужно применить к полю (в стандартном шаблоне)
* `template` - имя шаблона, который будет использован для отрисовки поля. Будет выполнен поиск ejs-шаблона с таким именем в стандартной теме, а в директриях указанных в настройке templates модуля.

В кастомном шаблоне доступны все переменные, передаваемые в стандартные шаблоны атрибутов:
* `item` - объект отображаемый формой
* `prop` - свойство объекта представляемое полем (если есть)
* `field`- мета-объект поля
* `id` - идентификатор поля, сформированный по стандартному алгоритму

## Сортировка - `"reorderable": true`

Применимо для атрибутов типа "Коллекция". Определяет возможность сортировки элементов коллекции стрелками вверх и вниз, меняет порядковые номера между двумя элементами коллекции.

```json
"options": {
  "reorderable": true`
}
```

## Подключение шаблона библиотеки `template`

### Подключение кастомного шаблона атрибута
Указываем значение пути к шаблону - располагаются в папке проекта `.\templates\registry\`. Пример для шаблона ниже `./templates/registry/attrs/project/stateView.ejs`

```json
"options": {
                "template": "attrs/project/stateView"
              }
```

Шаблону передается элемент `item` с основными командами `${item.getItemId()}`:
* получения значения элемента `item.property('stage').getValue()`, 
* идентификатора `item.getItemId()`
* имени класса `item.getClassName()`
Элемент объекта `prop`
* имени (кода) свойства `prop.getName()`
* вычислении значения атрибута (если формула) `prop.evaluate()`
* значения атрибута `prop.getValue()`
* ссылки на класс `prop.meta.refClass`

Также передаются пути модуля `${module}` для подключения шаблонов , например `<% stylesheet(`${module}/app-static/css/styles.css`) -%>`

### Подключение для коллекции иерархии `treegrid`

```json
"options": {
          "template": "treegrid/collection",
          "reorderable": true,
          "treegrid": {
            "width": "auto,100,100,100,100,0",
            "align": "left, center,center,center,center, left",
            "sort": "str, date, date, date, date, int",
            "enableAutoWidth": false,
            "paging": {
              "size": 20
            }
          }
        }
```

### Представление в списке объектов для цветных иконок

По тому же принципу что и в мете представлений создания/редактирования можно задавать переопределяющие шаблоны для меты представлений списков для каждой колонки:

```
...
"options":{ 
   "template": "templateDir/name" 
}
...
```
[пример] (https://ion-dv.atlassian.net/browse/MODREGISTR-404)

### Подключение для цифровых полей слайдера/бегунка slider

```json
"options": {
            "template": "slider",
            "slider": {
              "skin": "dhx_skyblue"
            }
          }

```

### Подключение для целочисленных полей бегунка `range`

Задается в представлении для свойства `"options"`:

```json
     ...
     "tags": null,
     "options": {
        "template": "range"
     }
     ...
```

## Подключение для коллекций функционала создания объектов не заходя на форму inplace

```json
"options": {
   "inplaceInsertion": true,
   "inplaceInsertionClass": "className@namespace"
}

```

### Пример `"options"` атрибута "Таблица"

```
 {
          "caption": "Таблица",
          "type": 3,
          "property": "table",
          "size": 2,
          "maskName": null,
          "mask": null,
          "mode": 3,
          "fields": [],
          "columns": [],
          "actions": null,
          "commands": null,
          "orderNumber": 50,
          "required": false,
          "visibility": null,
          "enablement": null,
          "obligation": null,
          "readonly": false,
          "selectionPaginated": true,
          "validators": null,
          "hint": "",
          "historyDisplayMode": 0,
          "tags": null,
          "options": {
            "inplaceInsertion": true
          },
          "selConditions": [],
          "selSorting": []
        },
```
`"inplaceInsertionClass"` указываем в том случае, если при создании объекта нужно выбирать класс (если есть наследники).

## Настройка расположения заголовка атрибута над значением.

```json
"options": {
   "cssClasses": ["top-label"]
}
```

## Настройка поля атрибута на всю длину строки (без наименования).

```json
"options": {
   "cssClasses": ["no-label"]
}
```

## Настройка стилей применяемых к контейнеру, в котором содержится поле ввода с названием.

```json
"options": {
   "cssStyles": {
    "max-width": "30%",
    "padding": "25px"
  }
}
```

## Настройка параметров колонок таблицы для атрибута типа "Коллекция"

По умолчанию колонка даты имеет ширину 110 пикселей и выравнивание по центру.

Возможные опции атрибута:

```
"options": {
  "template": "treegrid/collection",
    "treegrid": {      
      "width": "150,auto,200",
      "align": "center,left,center",
      "sort": "str, str, str", 
      "enableAutoWidth": false,  
      "paging": {
        "size": 20  
  }  
    }
}
```
## Настройка CSS полей через `tags` и `options`

Можно настраивать CSS поля либо через `tags`, либо через `options`. В регистри есть соответствующие стандартные css-классы с нужным поведением: nolabel, toplabel, fill. 

Для атрибута в мете представлений css-классы назначаются так:

### В свойстве `options`:

```
"options": {
  "cssClasses": ["toplabel", "fill"]
}
```
### В свойстве `tags` (обратная совместимость)
```
"tags": ["css-class:nolabel", "css-class:fill"]
```

Помимо классов можно напрямую задавать и стили (они будут применены только к контейнеру).

Задаем стили для атрибута в мете представлений:

### В свойстве `options`:

```
"options": {
  "cssStyles": {
    "max-width": "30%",
    "padding": "25px"
  }
}
```
### В свойстве `tags`:

```
"tags": ["css:min-width:10%", "css:background-color:green"]
```

Описание выше относится только к стандартным шаблонам полей из стандартной темы оформления. 

### Следующая страница: [Проектные документы](fileshare.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_view/options.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>         



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 