#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Установка окружения](docs/ru/1_system_deployment/step1_installing_environment.md)

# Шаг 2 Установка ядра, модулей и приложения

## Клонирование приложения и его компонентов

**NB:** пути не должны содержать русских букв и пробелов. Мы советуем размещать приложение в `c:\workspace`.

Рассматриваем формирование проекта с модулями на примере приложения `develop-and-test`.
1. Находим приложение в репозитории github. Набираем искомое приложение `develop-and-test` в поле поиска и переходим на него.

2. Переходим в репозиторий файлов на ветку версии.

3. Открываем файл `package.json` в котором смотрим зависимости.

```
 "engines": {
    "ion": "3.0.0"
  },
  "ionModulesDependencies": {
    "registry": "3.0.0",
    "geomap": "1.5.0",
    "portal": "1.4.0",
    "report": "2.0.0",
    "ionadmin": "2.0.0",
    "dashboard": "1.1.0",
    "soap": "1.1.2"
  },
  "ionMetaDependencies": {
    "viewlib": "0.9.1"
  }
```

1. `engines": "ion": 3.0.0` - версия ядра `3.0.0`.  

2. `ionModulesDependencies` - список модулей и их версий.  

3. `ionMetaDependencies` - список других метаданных, необходимых для проекта, в данном случае исключение `viewlib` - библиотека представлений.

**NB:** для переключения на tag номера версии - смотрите версии в файле `package.json`.

### Получение репозитория ядра

Ядро находится в репозитории [`framework`](https://github.com/iondv/framework). На главной странице есть поле с путем к репозиторию.

1. Запустите командную строку от имени администратора. 

2. Скопируйте адрес репозитория, перейдите в папку workspace командой  `cd c:\workspace` и выполните команду `git clone https://github.com/iondv/framework`. Эта команда создает папку `framework` и в неё клонирует репозиторий. 

### Получение модулей

1. Переходим в папку модулей командой `cd framework\modules`. 

2. Для каждого модуля из списка `package.json` в свойстве `ionModulesDependencies` - находим репозиторий модуля среди группы модулей ` https://github.com/iondv/ION-MODULES`.

3. Клонируйте все модули из списка `ionModulesDependencies` командой `git clone https://github.com/iondv/registry`.

4. Перейдите в папку установленного модуля, переключитесь на tag номера версии `git checkout tags/v1.27.1`. Например `1.27.1` - это номер версии модуля `registry`. 

5. Повторите для всех модулей. 

### Получение приложения

1. Переходим в папку приложения. Если вы находитесь в папке модулей выполните команду `cd ..\applications`.

2. Далее вернитесь на страницу репозитория `develop-and-test`, скопируйте путь и клонируйте его командой
`git clone https://github.com/iondv/develop-and-test`. 

3. Перейдите в папку установленного приложения, переключитесь на tag номера версии `git checkout tags/v1.17.0`.

4. Установка зависимостей в `ionMetaDependencies` осуществляется в папку `applications`, для установки необходимо убедиться, что находитесь в папке приложений. Клонируем приложения из списка в параметре  `ionMetaDependencies`. Для приложения `viewlib` клонируйте командой `git clone https://github.com/iondv/viewlib`.  

5. Перейдите в папку установленного приложения, переключитесь на tag номера версии `git checkout tags/v0.9.1`. Повторите для каждого приложения.

6. Приложение скомпоновано. 

**NB:** мы советуем создать для него проект в IDE, например Visual Studio Code и в нём создать конфигурациионный файл.  

## Конфигурациионный файл

Конфигурационный файл служит для задания основных параметров окружения приложения и настройки дополнительных параметров запуска.

1. Создайте конфигурационный файл `setup` с расширением `ini` в папке `config`.

2. Открываем файл в редакторе и вставляем содержимое. 

```
auth.denyTop=false 
auth.registration=false 
auth.exclude[]=/files/**
auth.exclude[]=/images/**
db.uri=mongodb://127.0.0.1:27017/iondv-dnt-db
server.ports[]=8888
module.default=registry
fs.storageRoot=./files
fs.urlBase=/files

```
Самый главный параметр - `db.uri=mongodb://127.0.0.1:27017/db`. Он указывает на название базы которую мы будем использовать для приложения. База данных будет создана автоматически.

### Следующая страница: [Шаг 3 Сборка, развертывание и запуск](step3_building_and_running.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/docs/en/1_system_deployment/step2_project_with_modules.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>         



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved.  




