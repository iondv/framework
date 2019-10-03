#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Метка времени и пользователя создания и изменения](time_user_tracker.md)

# Журналирование

**Журналирование** - указывает на необходимость журналирования всех действий произведенных над объектом. Находится в поле `journaling` основной части меты класса. Значение `true` указывает на необходимость журналирования. Если в поле  указано значение `false` или отсутсвует, то журналирование изменений объекта не требуется. 

## Пример:

```
{
  "isStruct": false,
  "key": "okato",
  "semantic": "name",
  "name": "naselenniyPunkt",
  "caption": "Населенный пункт",
  "journaling": true,
  "ancestor": null,
  "container": "",
  "creationTracker": "",
  "changeTracker": "",
  "properties": []
}
```  


### Следующая страница: [Индексация](composite_indexes.md)
--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_class/journaling.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>         



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 