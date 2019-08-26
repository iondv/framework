# Файлы в папке "bin"

В папке содержаться скрипты запуска приложения, реализованного на IONDV. Framework, такие как:

* [acl.js](/docs/ru/1_system_deployment/files_in_folder_bin.md#acljs)
* [export.js](/docs/ru/1_system_deployment/files_in_folder_bin.md#exportjs)
* [import.js и import-data.js](/docs/ru/1_system_deployment/files_in_folder_bin.md#importjs-%D0%B8-import-datajs)
* [setup.js](/docs/ru/1_system_deployment/files_in_folder_bin.md#setupjs)

```
NB. Запускаются локально из папки platform, шаблоны команд указаны в разделах с описанием назначения скрипта.
```

## acl.js

Шаблон команды запуска: `node %NODE_PATH%\bin\acl.js --d %NODE_PATH%\applications\%IONAPP%\acl`
где, `NODE_PATH` - путь к директории платформы, `%IONAPP%` - наименование приложения.

Добавляет права на объекты системы, указанные в папке acl.

Так же доступны команды для создания роли и прав для нее в системе, в случае если в приложении отсутствуют настройки в папке **acl**:

- [x] Настройка логина и пароль - `node bin/adduser.js --name admin --pwd 123`

- [x] Настройка доступа - `node bin/acl.js --u admin@local --role admin --p full`

- [x] Права на генерацию токена для сервиса rest/token - `node bin/acl.js --role admin --p USE --res ws:::gen-ws-token`

```
По такому же принципу можно задавать пользователей и права на отдельные ресурсы системы
```

## export.js

Шаблон команды запуска: `node bin/export --ns %IONAPP%`
где, `NODE_PATH` - путь к директории платформы, `%IONAPP%` - наименование приложения (namespace).

Выполняет экспорт данных и меты из приложения, которое в данный момент собрано и запущено локально. 
Файлы экспорта формируются в структуру папок, которые расположены на одном уровне с директорией платформы в папке _out_.

## import.js и import-data.js

При импорте меты, по умолчанию, импорт данных не выполняется. Поэтому,
для импорта меты вместе с данными вызываем команду:

`node bin/import.js --src %NODE_PATH%/applications/%IONAPP% --with-data --ns %IONAPP%`
где, `NODE_PATH` - путь к директории платформы, `%IONAPP%` - наименование приложения (namespace).

А для импорта непосредственно данных вызываем:

`node %NODE_PATH%/bin/import-data.js --src %NODE_PATH%/applications/%IONAPP%/data --ns %IONAPP%`

При этом, если импортируем мету и данные, указываем директорию приложения (при этом данные для импорта будут искаться в поддиректории data), если импортируем данные, нужно указывать непосредственно директорию с данными.

## setup.js

Шаблон команды запуска: `node %NODE_PATH%\bin\setup %IONAPP%`
где, `NODE_PATH` - путь к директории платформы, `%IONAPP%` - наименование приложения.

Выполняет установку приложения, запускает скрипт развертывания приложения, что включает в себя импорт и запись в базу данных меты модулей приложения.