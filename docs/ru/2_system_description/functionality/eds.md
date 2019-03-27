#### [Содержание](/docs/ru/index.md)

### Назад: [Функциональность](/docs/ru/2_system_description/functionality/functionality.md)

# Электронно-цифровая подпись

## Описание

Электронно-цифровая подпись (ЭЦП) - это реквизит электронного документа, предназначенный для защиты данного электронного документа от подделки, полученный в результате криптографического преобразования информации с использованием закрытого ключа электронной цифровой подписи и позволяющий идентифицировать владельца сертификата ключа подписи, а также установить отсутствие искажения информации в электронном документе.

## Реализация

ЭЦП можно отнести к утилитам для приложения, так как основная реализация находится в приложении. Обычно реализация ЭЦП находиться в папке приложения `lib/digest` (на примере приложения project-management):

- `lib/digest/digestData.js` - проверка при загрузке формы объекта на необходимость в электронной подписи (_applicable) и процесс подписи при выполнении перехода БП (_process)
- `lib/digest/signSaver.js` - прикрепление подписи к объекту

Для того, чтобы статус ЭП запрашивался/отображался, для registry добавляем в `deploy` настройку signedClasses.

```
"modules": {
    "registry": {
      "globals": {
         "signedClasses": [
          "class@application"
         ],
...
```

В БП `workflows/indicatorValueBasic.wf.json` добавляем переход со свойством `"signBefore": true`
```
 {
      "name": "needAppTrs_sign",
      "caption": "На утверждение",
      "startState": "edit",
      "finishState": "onapp",
      "signBefore": true,
      "signAfter": false,
      "roles": [],
      "assignments": [
        {
          "key": "state",
          "value": "onapp"
        }
      ],
      "conditions": []
    }
```

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](/docs/en/2_system_description/functionality/virtual_attr.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.   
All rights reserved. 
