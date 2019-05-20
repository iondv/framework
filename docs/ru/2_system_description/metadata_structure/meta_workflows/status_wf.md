#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Мета бизнес-процесса](/docs/ru/2_system_description/metadata_structure/meta_workflows/meta_workflows.md)

# Статусы бизнес-процесса

### JSON

```
"states": [
    {
      "name": "new",
      "caption": "Новое",
      "maxPeriod": null,
      "conditions": [],
      "itemPermissions": [],
      "propertyPermissions": [],
      "selectionProviders": []
    }
  ]
  
```
## Описание полей 

| Поле |Описание  |
|:-----|:-----------|
|`"name"`|  Системное имя статуса|
|`"caption"`| Логическое имя статуса|
|`"maxPeriod"`|  _нет данных_ |
|`"conditions"`|  Условия для статуса БП. Задаются аналогично "Условиям отбора допустимых значений".  |
|`"itemPermissions"`| Разрешения для объекта |
|`"propertyPermissions"`|   Разрешения для свойств |
|`"selectionProviders"`|   Выборка допустимых значений


### Следующая страница: [Переходы бизнес-процесса](/docs/ru/2_system_description/metadata_structure/meta_workflows/transitions_wf.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_workflows/status_wf.md)   &ensp; [FAQs](/faqs.md)  <div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>
 
 --------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 