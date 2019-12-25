//dataRepo
info from
1. core\impl\datarepository\ionDataRepository.js
2. core\interfaces\DataRepository\DataRepository.js
3. core\interfaces\MetaRepository\MetaRepository.js
4. core\impl\meta\DsMetaRepository.js
5. core\iterfaces\DataSource.js
6. core\impl\datasource\mongodb.js
//
supported calls:

1. wrap(className, data, [version], [options])
supported options:
user
...

2. setValidators(validators[])
...

3. getCount(obj, [options])
supported options:
filter

Возвращает количество объектов класса obj в базе данных.
...

4. getList(obj, [options])
supported options:
filter
offset
count
sort
countTotal
nestingDepth
env
user

Возвращает список объектов класса obj в базе данных.
...

5. getIterator(obj, [options])
supported options:
filter
offset
count
sort
countTotal
nestingDepth
env
user

предположительно https://docs.mongodb.com/manual/tutorial/iterate-a-cursor/
...

6. aggregate(className, [options])
supported options:
user
expressions
filter
groupBy

предположительно https://docs.mongodb.com/manual/aggregation/

...

7. rawData(className, [options])
supported options:
user
filter
attributes
distinct

https://docs.mongodb.com/manual/reference/method/db.collection.find/
...

8. getItem(obj, [id], [options])
supported options:
filter
nestingDepth
user
...

9. createItem(className, data, [version], [changeLogger], [options])
supported options:
nestingDepth
skipResult
adjustAutoInc
user
...

10. editItem(className, id, data, [changeLogger], [options])
supported options:
nestingDepth
skipResult
adjustAutoInc 
user
...

11. saveItem(className, id, data, [version], [changeLogger], [options])
supported options:
nestingDepth
autoAssign
skipResult
adjustAutoInc
user
...

12. deleteItem(className, id, [changeLogger], [options])
supported options:
user
...

13. put(master, collection, details, [changeLogger], [options])
supported options:
user
...

14. eject(master, collection, details, [changeLogger], [options])
supported options:
user
...

15. getAssociationsList(master, collection, [options])
supported options:
filter
offset
count
sort
countTotal
nestingDepth
user
...

16. getAssociationsCount(master, collection, [options])
supported options:
filter
offset
count
sort
countTotal
nestingDepth
user
...

17. bulkEdit(classname, data, [options])
supported options:
filter
nestingDepth
forceEnrichment
user
...

18. bulkDelete(classname, [options])
supported options:
filter
user

19. recache(item, [options])
...