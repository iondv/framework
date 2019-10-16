#### [Оглавление](/docs/ru/index.md)

### Назад: [Функциональность](functionality.md)

# Шаблоны модулей

## Тема оформления

Тема оформления - директория следующей структуры:

```
/static/css     директория стилей
/static/js        директория скриптов
/templates    директория шаблонов ejs
```

Темы оформления могут располагаться:

 * В директории `view` модуля и платформы - тогда это системные темы оформления
 * В директории `applications` платформы как приложения - тогда это проектные темы оформления
 * В директории `themes` приложения - тогда это проектные темы офрмления

Настройка текущей темы оформления:

 1. Для платформы
  * Настройка *theme* в config.json платформы
  * Настройка *globals.theme* в deploy.json приложения
 2. Для модуля
  * Настройка *theme* в config.json модуля
  * Настройка **Имя модуля**.*globals.theme* в deploy.json приложения

По умолчанию используется системная тема `default` (в платформе и модулях registry, geomap, report, offline-sync).

В настроке `theme` указывается путь до директории темы, он разрешается в соответствии с правилами:
 1. Абсолютный путь берется как есть
 2. Относительный путь разрешается относительно системных путей в следующем порядке:
  * Относительно директории `view` модуля или платформы
  * Относительно директории `applications` платформы
  * Относительно директории платформы

### Пример в dnt

```
"geomap": {
      "globals": {
        "theme": "develop-and-test/themes/geomap",
```

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/docs/en/2_system_description/functionality/module_templates.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>         



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 