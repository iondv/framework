#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Мета отчёта](/docs/ru/2_system_description/metadata_structure/meta_report/meta_report.md)

# Конфигурационный файл - `deploy.json`

**Конфигурационный файл deploy.json** - это файл, в котором описывается структура параметров программной системы и её конкретная настройка.

## Структура файла deploy.json: 

|   Поле        |   Имя    | Описание      |
|:-------------|:--------|:-------------|
| `"namespace":`   |  **Название проекта**  | Пространство имен проекта.  |
| `"parametrised": true,`| **Параметризация**   | Подключение параметризации. При установленном значении "true" есть возможность задавать параметры, в которые, при сборке приложения, передаются переменные, заданные в ini-файлах или переменных окружения проекта.   |
| `"globals": {`     |  [**Глобальные настройки**](deploy_globals.md)  | Глобальные параметры конфигурирования.   |
| `"deployer": "built-in"`    | **Сборки**   | Параметр конфигурирования сборки, на данный момент единственный.  |
| `"modules"`     |  [**Настройки модулей**](deploy_modules.md)  | Массив объектов - описание модулей.  |

### Пример файла [deploy.json](deploy_ex.md)

### Следующая страница: [Зависимости в package.json](package.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/docs/en/2_system_description/platform_configuration/deploy.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>
 
 --------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 