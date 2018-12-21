#### [Content](/docs/en/index.md)

# Connection of two namespaces

## Connection of two projects using "namespace"

It is used if you need to link two projects together and deploy them on the same platform, with references and collections not only within the project but also to others deployed in the same context. Implemented using the project namespace, so it would be apperent what classes are to what projects. For example, we associate the test project `develop-and-test` with the project `fias`:

### Example

```json
{
  "namespace": "develop-and-test",
  "code": "projectJoin.addressExt",
  "orderNumber": 0,
  "type": 1,
  "title": "",
  "caption": "Адрес ФИАС",
  "classname": "address@fias",
  "container": null,
  "collection": null,
  "url": null,
  "hint": null,
  "conditions": [],
  "sorting": [],
  "pathChains": [],
  "metaVersion": "2.0.61.21119"
}
```

In the `develop-and-test` project menu, there is a navigation node, which is a class representation from the fias project. Thus, when navigating through the menu item of one project, we obtain data from another project, if the required namespace are specifyed.

## Description

### For meta:

When importing, the namespace is taken not from the parameter, but the meta class. We remove namespace as a navigation parameter, etc.

When importing navigation meta, if the system names match the last meta is top-priority. But take into account that the empty value of the attribute does not override a non-empty one.

### For Studio:

In meta class there is the `namespace` property. In the Studio, the parameter "namespace" has been added in the ION project settings. By default, this namespace is inserted into the corresponding field on the class creation form.

The "namespace" attribute is also set to separate fields on the forms for creating and editing a class. In the studio, the system class name is now displayed everywhere with a namespace through a `@` sign if the class is declared in a namespace other than the name of the current project.

Namespace field is in the form of a drop-down list, from where you can choose either a project's namespace or project-related namespaces (Project references). At the same time there is an opportunity to set it manually.

The rest of the meta objects has no namespaces, but links to classes everywhere must be affixed with the account of namespaces (in the reference attributes too). This means that the class selection list must contain the full name of the class with a namespace.

Also the classes from all Project References should be in the class selection lists. At the physical level, the namespace is included in the file name of the class meta file (and directories if they participate in the formation of the class binding logic, for example, the meta view).

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](\docs\en\2_system_description\functionality\namespace.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.
All rights reserved. 