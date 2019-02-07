#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Мета отчёта](/docs/ru/2_system_description/metadata_structure/meta_report/meta_report.md)

# Конфигурационный файл - `deploy.json`

**Конфигурационный файл deploy.json** - это файл, в котором описывается структура параметров программной системы и её конкретная настройка.

## Структура файла deploy.json: 

|   Поле        |   Имя    | Описание      |
|:-------------|:--------|:-------------|
| `"namespace":`   |  **Название проекта**  | Пространство имен проекта.  |
| `"parametrised": true,`| **Параметризация**   | Подключение параметризации. При установленном значении "true" есть возможность задавать параметры, в которые, при сборке приложения, передаются переменные, заданные в ini-файлах или переменных окружения проекта.   |
| `"globals": {`     |  [**Глобальные настройки**](/docs/ru/2_system_description/platform_configuration/deploy_globals.md)  | Глобальные параметры конфигурирования.   |
| `"deployer": "built-in"`    | **Сборки**   | Параметр конфигурирования сборки, на данный момент единственный.  |
| `"modules"`     |  [**Настройки модулей**](/docs/ru/2_system_description/platform_configuration/deploy_modules.md)  | Массив объектов - описание модулей.  |

### Пример файла [deploy.json](/docs/ru/2_system_description/platform_configuration/deploy_ex.md)

### Следующая страница: [Зависимости в package.json](/docs/ru/2_system_description/platform_configuration/package.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](/docs/en/2_system_description/platform_configuration/deploy.md)   &ensp; [FAQs](/faqs.md) 
 
 --------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 