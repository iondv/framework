#### [Content](/docs/en/index.md)

### The previous page: [Configuration file - deploy.json](/docs/en/2_system_description/platform_configuration/deploy.md)

# Зависмости в package.json

The **package.json** file - defines the structure of dependencies and the detailed composition of the system modules.

```
"ionMetaDependencies": { 
  "viewlib": "0.0.1" 
}
```

## Specificity of connection using script

* if there is no slash in the object name - / => "project-management"- substitute in the default path the ION-APP group - i.e the path is - //git.iondv.ru/ION-APP/project-management.
* if there is a slash in the object name - it means it’s already set up with the group and just pick up the path to the git with the group and meta, for example "ION-METADATA/viewlib" - the path - //git.iondv.ru/ION-METADATA/viewlib.
* if the version value begins with git+http:// или git+https:// - then this is the full path to the external repository - drop git+ and pull the git.
* if the version value begins with http:// or https:// - then this is the full path to the archive - pull and unzip.  
**Not realized**, as dapp does not support working with archives.

### Example of the `package.json` file

```
{
  "name": "develop-and-test",
  "description": "Metaproject for develop and test",
  "version": "1.9.2",
  "homepage": "http://docker.local:8080",
  "bugs": {
    "url": "https://ion-dv.atlassian.net/projects/IONCORE/issues"
  },
  "repository": {
    "type": "git",
    "url": "https://git.iondv.ru/ION-METADATA/develop-and-test.git"
  },
  "engines": {
    "ion": "1.24.1"
  },
  "scripts": {
    "test": "mocha ./test/e2e/**/*.js"
  },
  "ionModulesDependencies": {
    "registry": "1.27.1",
    "geomap": "1.5.0",
    "portal": "1.3.0",
    "report": "1.9.2",
    "ionadmin": "1.4.0",
    "dashboard": "1.1.0",
    "rest": "1.1.2",
    "gantt-chart": "0.8.0"
  },
  "ionMetaDependencies": {
    "viewlib": "0.9.1"
  },
  "dependencies": {
    "esia": "git+https://git.iondv.ru/node-modules/esia.git"
  },
}


```
## Field description

| Field            | Name | Description                                                                                                                                                                                                                                                                                  |
|:----------------|:----------------------|:--------------------------------|
| `"name"`       | **Name**      | Имя проекта.  |
| `"description"`| **Description** | Описание проекта. |
| `"version"`    | **Version**   | Номер текущей версии. |
| `"homepage"`   | **Home page** | Ссылка на собранный проект на докере. |
|    `"bugs"`     |   **Bugs**           | Указывается ссылка на проект приложения в GitLab, где принимаются заявки об ошибках.|
| `"repository"` | **Repository**  | Состоит из полей "type" и "url". Указыается тип репозитория и ссылка на него.                                                                                                                                                                                                                   |
| `"engines"`    | **Core**     | Номер версии ядра.  |
| `"scripts"`    | **Скрипты**  | Скрипт для сборки меты из разных групп и разных url.
| `"ionModulesDependencies"`        | **Зависимости модулей ion**               | Задает модули и их версии, используемые  в приложении. Проект включает в себя следующий состав модулей: •  "**ionadmin**" – модуль администрирования •  "**registry**" – модуль регистра •  "**report**" – модуль отчетов •  "**rest**": "- модуль rest-сервисов •  "**dashboard**" – модуль дашбоардов •  "**geomap**" - геомодуль •  "**gantt-chart**" – модуль диаграмм ганта •  "**portal**" – модуль портала                                                                                                                                    |
| `"ionMetaDependencies"`       | **Зависимости метаданных ion**        | Дополнительные приложения для функционирования системы.                                                                                                                                                                                                       |                                                                                                                                                                                                                                                                                                                                                                                              
| `"dependencies"`   | **Зависимости**      |  Прочие зависимости проекта.


### Следующая страница: [Конфигурация парметров - ini-файл](/docs/en/2_system_description/platform_configuration/ini_files.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/platform_configuration/package.md)   &ensp; [FAQs](/faqs.md) 
 
 --------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 