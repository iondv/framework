#### [Content](/docs/en/index.md)

### The previous page: [Workflow transitions](/docs/en/2_system_description/metadata_structure/meta_workflows/transitions_wf.md)

# Meta security

## Configuration of the security rights

### How to form resource identifier?

* navigation node - `n:::namespace@code`
* class - `c:::classname@namespace`
* object - `i:::classname@namespace@id`
* attribute - `a:::classname@namespace.propertyname`
* geometa:
  * navigation node: geonav:::code of the node@namespace
  * layer: geolayer:::code of the layer@namespace
  * data: geodata:::code of the layer@namespace@query index
* paths (of modules):
  * portal module: `sys:::url:portal/*`
  * geomap module: `sys:::url:geomap/*`

#### "Read"

`read` - is the right to view information on class objects. It sets the permission to view the class objects as read-only and prohibits the creation/editing of objects.

```
- id: Users
    name: Regular users
    permissions:
      n:::ns@navigationName:
        - read
...
```

#### "Write"

`write` - is the right to create the class objects. It sets the permission to crate new class objects and prohibits editing of existing ones. 

```
- id: Users
    name: Regular users
    permissions:
      n:::ns@navigationName:
        - write
...
```

#### "Use"

`use` - is the right to create the class objects. It sets the permission to create class objects and to use them in the reference and collections. 

Without `use` - references are also displayed in the collection. If there is  `read`, but no `use`, then it is imposible to select an object and place it the collection. 

```
- id: Users
    name: Regular users
    permissions:
      n:::ns@navigationName:
        - use
...
```

#### "Delete"

`delete` - is the right to delete the class objects.

#### "Full"

`full` - is the right of full access to the class objects.


## Dynamic security

```
"PROJECT_BENEFITIAR": {
"resource":

{ "id": "pm::project" }
,
"attribute": "stakeholders.id"
}
```

If the project in `stakeholders.id` has a value associated with the current user (pulling an organization as a global user role is set), then you should consider the current user ` PROJECT_BENEFITIAR` and check the rights to the `pm:project` resource - these rights will be the rights to project.

`pm:project` - is a kind of virtual security resource. It is necessary to abstract the access settings from the checked object for different roles. You can specify different resources for one class and vice versa.

If you did not specify a resource, then the rights to the class object will be checked. Then this role can be used as static, which means, to issue static rights dynamically.


## Multidynamic security

```
"roleMap": {
  "organization@project-management": {
    "ORGANIZATION_STAFF": {
      "caption": "Employee of the organisation",
        "resource": {
          "id": "pm::organization",
          "caption": "Organisation"
        },
        "sids": [ // apply the role, if:
          "$employee", // the value associated with user in the employee attribute (user is employee)
          // OR
          "admin", // user is admin (role, account or identifiers associated with user)
          // OR
          [
             "$boss", // the value associated with user in the $boss attribute (user is boss)
             // AND
             "supervisor" // user is supervisor (role or account)
          ]
        ],
        "conditions": {"eq": ["$state", "active"]}, // apply role only to active organizations
        "attribute": "employee.id", // add to "sids"
      }
    },
```
When specifying `sids`, each level of nesting arrays of values changes the type of operation `AND`/`OR`. At the first level, the `OR` is applied.

## How to define user roles

1. Register a user with full admin privilege - `admin`.
2. As `admin` in` registry` in the Security, Divisions section set up a hierarchy of divisions (division code = security identifier).
3. Register a user without full admin privilege - `user`.
4. As `admin` in` registry` in the Security, Divisions section create an  Employee, specify the User with no rights in its User attribute. We bind the employee to the subordinate division.
5. Connect as `user` - and you have no rights.
6. Connect as `admin` and give the rights to arbitrary classes and navigation nodes to roles, corresponding to the highest division.
7. Connect as  `user` - and you have an access to all objects of the division. 
8. Similarly, we check the rights throughout the hierarchy of divisions.

### Example of the configuration in `deploy.json`

```
"actualAclProvider":{
        "module": "core/impl/access/aclmongo",
        "initMethod": "init",
        "initLevel": 1,
        "options":{
          "dataSource": "ion://Db"
        }
      },
      "roleAccessManager": {
        "module": "core/impl/access/amAccessManager",
        "initMethod": "init",
        "initLevel": 1,
        "options": {
          "dataSource": "ion://Db"
        }
      },
      "aclProvider": {
        "module": "core/impl/access/aclMetaMap",
        "options":{
          "dataRepo": "ion://dataRepo",
          "acl": "ion://actualAclProvider",
          "accessManager": "ion://roleAccessManager",
          "map": {
            "employee@develop-and-test": {
              "isEntry": true,
              "sidAttribute": "uid",
              "jumps": ["department"]
            },
            "department@develop-and-test": {
              "sidAttribute": "code",
              "jumps": ["superior"]
            }
          }
        }
      },
```

## How to display attributes and objects in accordance with specified rights?

The class [Projects] contains the attribute of the "Collection" type - [Events].
If the [Events] class does not have read access, then the attribute of this class is not displayed on the view form of the [Projects] class.

If there is dynamic security for a class, then whether or not you have read access to the class [Events] - the attribute on the form of the class[Projects] will be displayed, but the event objects will be displayed only if you have rights.

**NB:** it is necessary to set both static and dynamic security for a class by the attribute reference to display an attribute and objects.

That is, if there is a static "read-only" right for the class, the user will see all objects of this class, regardless of the dynamic rights. In addition, a sample of objects will be made. Objects that are configured for dynamic security will be displayed to the user in accordance with their settings.

### The next page: [Meta report](/docs/en/2_system_description/metadata_structure/meta_report/meta_report.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_security/meta_security.md)   &ensp; [FAQs](/faqs.md) 
 
 --------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 