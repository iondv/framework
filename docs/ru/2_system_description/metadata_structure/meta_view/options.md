#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [CSS поля](/docs/ru/2_system_description/metadata_structure/meta_view/tags.md)

# Опции `"options"`
<https://ion-dv.atlassian.net/browse/IONCORE-353?focusedCommentId=62704&page=com.atlassian.jira.plugin.system.issuetabpanels%3Acomment-tabpanel#comment-62704>
Предназначены для установления дополнительных параметров атрибута

Интерпретация настроек выполняется конкретной специфической реализацией модуля.
На данный момент в registry поддерживаются следующие настройки:
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

## Сортировка `"reorderable": true`
Применимо для атрибутов типа "Коллекция"
Определяет возможность сортировки элементов коллекции стрелками вверх и вниз, меняет порядковые номера между двумя элементами коллекции.

```json
"options": {
  "reorderable": true`
}
```

## Подключение шаблона библиотеки `template` и её параметры

### Подключение кастомного шаблона атрибута
Указываем значение пути к шаблону - располагаются в папке проекат`.\templates\registry\`, пример для шаблона ниже `./templates/registry/attrs/project/stateView.ejs`

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

*Результат:*

![image](/uploads/a30fc8c65561574926547efc74f09ddf/image.png)

## Подключение для коллекций функционала создания объектов не заходя на форму inplace

```json
"options": {
   "inplaceInsertion": true,
   "inplaceInsertionClass": "className@namespace"
}

```
`"inplaceInsertionClass"` указываем в том случае, если при создании объекта нужно выбирать класс (если есть наследники)

[настройка в ДНТ](https://git.iondv.ru/ION-APP/develop-and-test/blob/v1.7/views/classColl@develop-and-test/item.json)

## Настройка расположения заголовка атрибута над значением.

```json
"options": {
   "cssClasses": ["top-label"]
}
```

результат:

 ![image](/uploads/1ec7444efec94448a160d233086ee521/image.png)

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

По умолчанию ширина для колонки даты 110 пк и выравнивание по центру.

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
### Следующая страница: 

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_view/options.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 