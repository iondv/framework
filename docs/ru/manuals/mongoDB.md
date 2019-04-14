#### [Оглавление](/docs/ru/index.md)

# Работа с MongoDB

## Ошибка превышения кол-ва открытых файлов

Часто в отчетах на больших проектах бывает ошибка 
```
 MongoError: copying index for $out failed. 
index: { v: 2, key: { id: 1 }, name: "id_1", ns: "ion_pm.tmp.agg_out.162" } 
error: { connectionId: 454, err: "24: Too many open files", code: 8, codeName: "UnknownError", n: 0, ok: 1.0 }
```
Решается так https://stackoverflow.com/questions/20931909/too-many-open-files-while-ensure-index-mongo

## CLI и утилиты для MongoDB
[Robomongo](http://robomongo.org/)
[Compass от разработчиков MongoDB](https://www.mongodb.com/download-center#compass)  - только чтение, нельзя менять документы
[Подборка утилит](http://mongodb-tools.com/)

## Настройка логгирования запросов - профилирование
http://amezhenin.ru/mongodb/mongodb-profiling-part-1

Для целей профилирования работы, в MongoDB существует специальная коллекция system.profile. В терминологии MongoDB, system.profile является ограниченной коллекцией (capped collection), потому что её размер ограничен 1Мб. По умолчанию профилирование запросов отключено, и никакой информации о работе системы не сохраняется.
```
db.getProfilingStatus() - returns if profiling is on and slow threshold
db.setProfilingLevel(level, <slowms>) 0=off 1=slow 2=all
```

0. , профилирование отключено полность. Это режим по умолчанию, если вы еще не успели настроить профилирование в своей БД, то вы должны увидеть следующее:
  ```
      > db.getProfilingStatus()
      { "was" : 0, "slowms" : 100 }
  ```

1. , профилирование медленных запросов. Этот режим я использую на продакшене, потому что он позволяет логировать только запросы, выполнявшиеся дольше определенного порога(threshold). Когда вы устанавливаете этот режим, второй параметр в db.setProfilingLevel становится обязательным и указывает на размер порога срабатывания в миллисекундах. Я использую порог в 100 мс, но это дело вкуса:
  ```    > db.setProfilingLevel(1, 100)
      { "was" : 0, "slowms" : 100, "ok" : 1 }
      > db.getProfilingStatus()
      { "was" : 1, "slowms" : 100 }
  ```

2. , профилирование всех запроса. Хорошо подходит для разработки, но на продакшене использовать нецелесообразно: старые данные профайлера быстро затираются, а накладные расходы на поддержание столь подробного лога, увеличиваются.
  ```    > db.setProfilingLevel(2)
      { "was" : 1, "slowms" : 100, "ok" : 1 }
      > db.getProfilingStatus()
      { "was" : 2, "slowms" : 100 }
  ```

### Структура документов в system.profile
Все записи профайлера представляют собой обычные документы со следующим набором основных полей: * op, тип операции(insert, query, update, remove, getmore, command) * ns, коллекция(а точнее namespace), над которой производится операция * millis, время выполнения операции в миллисекундах * ts, время(timestamp) операции. Большого значения это не имеет, но это дата окончания выполнения операции. * client, IP-адрес или имя хоста, с которого была отправлена команда * user, авторизованный пользователь, который выполнил запрос.

В дополнение к основным полям, есть ещё поля, специфические для каждого типа запроса. Для поиска(find) это будет сам запрос(query), информация о числе просканированных(nscanned) и возвращенных(nreturned) документов, для изменения(update) это будет число обновленных(nupdated) и перемещённых на диске(nmoved) элементом. [Документация](http://docs.mongodb.org/manual/reference/database-profiler/#output-reference)

### Логирование
В логах отражают обращения в БД, которые выполнялись более 100 мс. 
```
Wed Jun 26 22:02:06.197 [conn1599] insert test_db.events ninserted:1 keyUpdates:0 locks(micros) w:31 152ms
Wed Jun 26 22:02:41.183 [conn1598] insert test_db.events ninserted:1 keyUpdates:0 locks(micros) w:33 185ms
```

## Настройка zabbix для анализа MongoDB
http://habrahabr.ru/post/143498/
Используется [плагин](https://code.google.com/p/mikoomi/wiki/03)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.ru/index.html) &ensp;  [ENG](/docs/en/1_system_deployment/step1_installing_environment.md)    &ensp; [FAQs](/faqs.md)  <div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>         



--------------------------------------------------------------------------  

Copyright (c) 2018 **IONDV.Framework**.  
All rights reserved. 