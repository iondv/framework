#### [Содержание](/docs/ru/index.md)

### Назад: [Функциональность](/docs/ru/2_system_description/functionality/functionality.md)

# Электронно-цифровая подпись

## Описание

Электронно-цифровая подпись (ЭЦП) - это реквизит электронного документа, предназначенный для защиты данного электронного документа от подделки, полученный в результате криптографического преобразования информации с использованием закрытого ключа электронной цифровой подписи и позволяющий идентифицировать владельца сертификата ключа подписи, а также установить отсутствие искажения информации в электронном документе.

## TODO

Для того, чтобы статус ЭП запрашивался/отображался, для registry добавляем в deploy.json настройку signedClasses.

```
"modules": {
    "registry": {
      "globals": {
         "signedClasses": [
          "class_string@develop-and-test",
          "signAfter@develop-and-test",
          "signBefore@develop-and-test"
         ],
```

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](/docs/en/2_system_description/functionality/virtual_attr.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.   
All rights reserved. 
