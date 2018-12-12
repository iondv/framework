#### [Content](/docs/en/index.md)

### The previous page: [](/docs/en/2_system_description/functionality/.md)

# Data caching

## Principle of work

Between the basic data repository `dataRepo` and the data repository with security checks `securedDataRepo`, a data repository with support for caching `cachedDataRepo` has been implemented. 

The data is loaded by chain: *BD -> dataRepo -> cachedDataRepo -> securedDataRepo*. 

However,  when running a query, the `cachedDataRepo` first checks for the availability of data in the cache (if the cache is enabled), and if there is no data in the cache, it requests it from `dataRepo`, then it places it in the cache and returns it to `securedDataRepo`.

## Setting caching objects of individual classes

In the configuration file (deploy.json), in the options `cachedDataRepo` you can individually specify the list of classes whose data should be stored in the cache.

### Example:
```
...
"options": {
  "cachedClasses": ["class1@namespace", "class2@namespace", "class3@namespace"]
}
...
```
If **cachedClasses** is not specified, then all data are cached. 

## Caching a list of objects

Both individual objects and lists are cached.
When a list is cached based on its selection conditions (including pagination), a key is generated, then a selection is performed and all received objects are cached individually, and the list is cached as an array of object identifiers.

When selecting a list from the cache, on the basis of this array, the corresponding objects are selected from the cache and the resulting list is formed.

Similarly, all objects are cached by reference and eager loaded collections.

## Setting the adaptive cache

For advanced configuration of cache (such as, query storage time, depth of storage of objects in the cache, etc.) the setting *adaptive object caching* is applied.

Adaptive cache settings are specified in the deploy.json file in the `"di"` property, in the `memcached` and` redis` components in the `connectOptions` option.

All the necessary placeholders are listed in the config.json file of the platform repository.

**NB:** The storage depth of objects in the cache corresponds to the depth of the query for objects from the database, that is, the object stores information about its references, and then in the cache the object graph is obtained, and not the tree.


## Setting the cache by use of the ini-file

Parameters in the ini-file:

```
...
cache.module - module used by the data repository for caching. 
(variants: ion://memcached, ion://redis, ion://innerCache)

cache.memcached.enabled=true // enable memcached
cache.memcached.location1 // server1
cache.memcached.location2 // server2
cache.memcached.timeout // cache access timeout

cache.redis.enabled=true // enable redis
cache.redis.host=127.0.0.1 // host redis
cache.redis.port=6379 // port redis
```
Cache is not used by default.

### The next page: [](/docs/en/2_system_description/functionality/.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](/docs/en/2_system_description/functionality/cached.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 