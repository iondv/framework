#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Статус бизнес-процесса](/docs/ru/2_system_description/metadata_structure/meta_workflows/status_wf.md)

# Переходы бизнес-процесса

### JSON
```
"transitions": [
    {
      "name": "basic",
      "caption": "На согласование",
      "startState": "create",
      "finishState": "inAgreed",
      "signBefore": false,
      "signAfter": false,
      "roles": [],
      "assignments": [],
      "conditions": []
    }
  ]
```
## Описание полей 

| Поле |Описание  |
|:-----|:-----------|
|`"name"`|  Системное имя статуса.|
|`"caption"`| Логическое имя статуса.|
|`"startState"`| Начальный статус для осуществления перехода по БП. |
|`"finishState"`|  Конечный статус по завершению перехода по БП. |
|`"signBefore"`| Логическое значение "Подписать до начала перехода". |
|`"signAfter"`|  Логическое значение "Подписать по завершению перехода". |
|`"roles"` |  Список ролей, с правами на осуществление перехода. |
| `"assignments"`| Присвоение значения атрибутам после осуществления перехода по БП. |
| `"conditions"` | Условия, выполняемые для осуществления перехода по БП. Задаются аналогично "Условиям отбора допустимых значений". |

## Присвоение значения атрибутам по ссылке

Задается через свойство `"assignments"` в переходе БП. 

### Пример

```
...
     "assignments": [
        {
          "key": "resolution.stateRemPet",
          "value": "end"
        }
      ]
...

```
По ссылке атрибута типа "Ссылка" [resolution], для атрибута [stateRemPet] присвоить значение "end" - при выполнении данного перехода по БП.

### Следующая страница: [Мета безопасности](/docs/ru/2_system_description/metadata_structure/meta_security/meta_security.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_workflows/transitions_wf.md)   &ensp; [FAQs](/faqs.md) 
 
 --------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 