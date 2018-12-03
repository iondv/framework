#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Конфигурационный файл deploy.json](/docs/ru/2_system_description/platform_configuration/deploy.md)

# Зависмости в package.json

Зависимости метаданных "ion" находятся в одном объекте - в "ionMetaDependencies" и указываются в файле **package.json**.

```
"ionMetaDependencies": { 
  "viewlib": "0.0.1" 
}
```

## Логика подключения при помощи скрипта

* если в названии объекта отсутствует слеш - / => "project-management"- подставляем в путь по умолчанию группу ION-APP - т.е. путь - //git.iondv.ru/ION-APP/project-management.
* если в названии есть слеш - значит задан уже с группой и просто склеиваем путь к гиту с группой и метой, пример "ION-METADATA/viewlib" - путь - //git.iondv.ru/ION-METADATA/viewlib.
* если значение версии начинается с git+http:// или git+https:// - то это полный путь к внешнему репозиторию - отбрасываем git+ и тянем гитом.
* если значение версии начинается с http:// или https:// - то это полный путь к архиву - тянем и распаковываем.  
**Не реализовано**, так как dapp не поддерживает работу с архивами.

### Пример `package.json`

```
{
  "name": "project-management",
  "description": "Проектное управление",
  "version": "2.10.0",
  "homepage": "",
  "bugs": {
    "url": "https://git.iondv.ru/ION-APP/project-management/issues"
  },
  "engines": {
    "ion": "1.24.0"
  },
  "license": "",
  "repository": {
    "type": "git",
    "url": "https://git.iondv.ru/ION-APP/project-management.git"
  },
  "ionModulesDependencies": {
    "ionadmin": "1.4.0",
    "registry": "1.27.0",
    "report": "1.9.1",
    "rest": "1.0.1",
    "dashboard": "1.1.0",
    "geomap": "1.5.0",
    "gantt-chart": "0.8.0",
    "portal": "1.3.0"
  },
  "ionMetaDependencies": {
    "viewlib": "0.9.0",
    "viewlib-extra": "0.1.0"
  },
  "devDependencies": {},
  "dependencies": {
    "csv-parser": "^1.11.0",
    "proj4": "^2.4.4",
    "sanitize-filename": "latest",
    "excel-data": "^2.0.1",
    "xlsx": "^0.8.0",
    "moment-range": "^3.1.1"
  }
}

```
## Описание полей
| Поле            | Наименование | Описание                                                                                                                                                                                                                                                                                 |
|:----------------|:----------------------|:--------------------------------|
| `"engines"`        | **Ядро**     | Версия ядра.  |
| `"repository"` | **Репозиторий**  | Состоит из полей "type" и "url". Указыается тип репозитория и ссылка на него.                                                                                                                                                                                                                     |
| `"ionModulesDependencies"`        | **Зависимости модулей ion**               | Задает модули и их версии, используемые  в приложении.                                                                                                                                            |
| `"ionMetaDependencies"`       | **Зависимости метаданных ion**        | ?                                                                                                                                                                                                       |
| `"devDependencies"`     | **?**    |       ?                                                                                                                                                                                                                             |
| `"license"`   | **Лицензия**             | Лицензия продукта.                                                                                                                                                                                 |
| `"dependencies"`   | **Зависимости**      |  ?
|    `"bugs"`     |   **Ошибки**           | Указывается ссылка на проект приложения в GitLab, где принимаются заявки об ошибках.

### Следующая страница: [Конфигурация парметров - ini-файл](/docs/ru/2_system_description/platform_configuration/ini_files.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](/docs/en/2_system_description/platform_configuration/package.md)   &ensp; [FAQs](/faqs.md) 
 
 --------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 