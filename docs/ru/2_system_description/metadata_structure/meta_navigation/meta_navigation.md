#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Мета представлений - типы представлений](/docs/ru/2_system_description/metadata_structure/meta_view/view_types.md)

# Мета навигации 

**Мета навигации** - регулирует расположение элементов в навигационном блоке. Мета навигации разделяется на мету узлов навигации и мету секции навигации. 

## Мета секций навигации

[**Мета секций навигации**](navigation_section.md) состоит из поля `"name" + .section.json` и находится в директории `navigation`. Например: `workflow.section.json`. 

## Мета узлов навигации

[**Мета узлов навигации**](navigation_nodes.md) состоит из:
* Для узлов навигации первого порядка - тех узлов, которые находятся непосредственно в секции навигации: поле `"code"` + `.json` и находится в директории, имя которой совпадает с именем файла секции навигации к которому относится узел навигации. 

_Например_: В директории `navigation` есть файл секции навигации `simpleTypes.section.json`. И есть узел навигации `classString.json`, который размещается в секции `simpleTypes`. Файл узла навигации будет иметь путь: `navigation\simpleTypes\classString.json`.
     
* Для узлов навигации второго порядка - тех узлов, которые входят в группу (особый тип узлов навигации, поле `"type"` в которых содержит значение `0`). 
Разница в том, что поле `"code"` у таких узлов составное и состоит из поля `"code"` группы и личного наименования. 

_Например_: `navigation\relations\classReference.refBase.json`. Это файл узла навигации `refBase`, который находится в группе `classReferense` секции навигации `relations`.

### Следующая страница: [Мета секций навигации](navigation_section.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_navigation/meta_navigation.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>         



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 