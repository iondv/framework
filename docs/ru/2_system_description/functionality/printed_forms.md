#### [Оглавление](/docs/ru/index.md)

### Назад: [Функциональность](functionality.md)

# Печатные формы

## Печатные формы Word

- Используется библиотека docxtemplater
- Примеры подключения и использования docxtemplater [здесь](http://javascript-ninja.fr/docxtemplater/v1/examples/demo.html).

### Параметры передачи форматирования

Для `table_col` параметр для передачи форматирования см. правила/примеры [здесь](https://momentjs.com/docs/#/displaying/).

вид: 
```
${table_col:коллекция:разделитель:формат}
```
пример:
```
${table_col:list.instructions.limit:;:DD.MM.YYYY}
```
результат:
```
30.08.2017;06.09.2017
```
В формате допускается использование символа `:`.

### Вывод значения суммы в прописном варианте

Для docx-шаблонов есть фильтр *toWords*, который по умолчанию преобразует просто в текст, если добавить вторым параметром true, то будет добавляться рублевый формат (рубли - копейки).

### Пример:
```
{costing.costExp | toWords:true}
```

В результате значение атрибута "costExp" = **345,52**. Результат в печатной форме будет = **Триста сорок пять рублей пятьдесят две копейки**.

### Преобразования между датой и строкой

Доступны к применению следующие функции:
* date - преобразование строки в дату
* upper - строку к верхнему регистру
* lower - строку к нижнему регистру

В экспорте в docx в выражениях доступны фильтры:
* lower - к нижнему регистру
* upper - к верхнему регистру
* dateFormat - дата к строке, примеры применения:
  * {now | dateFormat:`ru`}
  * {since | dateFormat:`ru`}
  * {date | dateFormat:`ru`:`YYYYMMDD`}
* toDate - строка к дате

### Значение текущей даты `_now`

```
{_now} г.
```

### Настройка для отображения значения полей из массива объектов

Если необходимо отобразить поля из массива объектов (коллекция например) используется тэг:

```
${table_col:list.collection.attrFromCollection}
```

По умолчанию значения будут объеденины через точку с запятой. Чтобы указать другой разделитель, укажите его после второго двоеточия:

```
${table_col:list.collection.attrFromCollection:разделитель}
```

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/docs/en/2_system_description/functionality/printed_forms.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>         



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 