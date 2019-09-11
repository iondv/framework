# Functionality of IONDV. Framework and its modules

## IONDV. Framework

**IONDV. Framework** provides the following functionality:

- descriptive metadata into the data storage structure in the DBMS;
- functionality to work with various DBMS (ORM technology);
- authorization in a system with different policies, by default oath2, with an open, configurable API for connecting passport library authorization modules which provides up to 500 different authorization policies;
- securing access to data - static securing to data types, to navigation, to stages of business processes, to actions on a form; dynamic securing- through the conditions in the data that the profile of the current user must correspond to (belonging to the unit or organization specified in the object, group or other conditions); through url; providing exceptions in authorization and security by url or for a special user;
- connection of modules providing additional functionality and implemented through access to the kernel interfaces (APIs);
- providing import, export of data in the system, metadata, security from files;
- providing interaction with the file system for storing data, including external file storages, such as nextcloud;
- calculating values with formulas and caching this data;
- providing eager loading and data filtering in connected collections;
- caching requests and sessions in memcached, redis;
- scheduled tasks;
- notification of users by events.

## Modules

Additional functionality is implemented with standard modules.

### Data accounting module registry:

- hierarchical display of navigation;
- displaying lists of data objects according to navigation conditions, filters, search results;
- the ability to create objects;
- display of unified forms of objects with the ability to edit, delete, modify work-flows, implement the conditions for displaying and overloading the presentation of a form in a business process;
- display of various types of attributes, including related in the form of tables or links, geo objects (including search for coordinates by address);
- display of data on their semantics (conditions for changes);
- the ability to change the display and interaction with the attributes of objects through custom HTML templates that receive data by REST-API;
- preparation of printed forms in docx and xlsx format based on lists or object data;
- display of user notifications;
- the ability to implement your own action buttons with server data processing.

### Reporting and Analytics Module - report:

- formation of calculated forms, with the ability to filter by values;
- data filtering;
- mathematical operations on data;
- pivot tables;
- REST API to report data.

### Display of data with geo-coordinates – geomap:

- implementation of data layers with filtering by conditions;
- ability to set data view icons by data type;
- display a pop-up window with brief information on an object;
- display of a template of detailed information on an object;
- search for objects;
- arbitrary boundary filtering;
- zoning and filtering by district boundaries;
- connection of the report module data, including with the calculated data for the region.

### REST and SOAP integration modules with standard APIs and user security:

- various custom types of authorization: in the header, token (inclusion of the service receiving a token after authorization in the header), without authorization;
- receiving lists of objects of each type with different filtering conditions;
- CRUD service for any data type;
- work-flow transition service;
- metadata retrieval service;
- the ability to connect arbitrary custom processing services.

### Dashboard module - dashboard:

- ensuring the formation of information blocks with digital and graphic data; 
- allows you to customize several groups of views and customize for each user.

### Administration module - ionadmin:

- provides user management, rights and roles, user blocking;
- generation of security keys (tokens) for integration services;
- monitoring of key server resources (using the dashboard module);
- analysis of slow DBMS queries;
- scheduled tasks setting;
- journaling changes of system objects;
- data and metadata backup;
- recalculation of semantics and formulas caches;
- notification management.

### Custom webpage creation module - portal:

- registration of arbitrary pages at the processing address (route);
- registration of static content;
- access security management;
- support for rendering pages from EJS templates.

### The IONDV. Studio application to create metadata:

- creating navigation;
- creating class structures;
- creating view for classes;
- creating work-flows;
- basic application setup;
- export and import of metadata;
- work in standalone mode with project files;
- work online with several projects hosted in the browser repository.

--------------------------------------------------------------------------  


#### [Licence](/LICENCE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [Russian](/docs/ru/key_features.md)   &ensp;           
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>


--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved.