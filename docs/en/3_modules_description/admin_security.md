#### [Content](/docs/en/index.md)

### Back: [The ionadmin module](/docs/en/3_modules_description/admin.md)

# Security settings

## Initialization

When setting up security for the first time, do the following:

1) Synchronize the rights so that the rights set via the acl utility appear in the admin area. Press the `"Synchronization of access rights"` button on the `/ionadmin/security/sync` page to synchronize the rights.

Upon completion there will be a message `"Access synchronization successfully conducted!"`.

2) Make import of resources. If on the `/ionadmin/security/resource` page there are no objects or really few, then you need to import the resources.

Press the `"Import resources"` button on the `/ionadmin/security/sync` page.

Upon completion there will be a message `"Import successfully completed!"`.

## Roles administration

You can create, edit or delete roles on the `/ionadmin/security/role` page:

1) Role creation. Press the "Create" button to create a role on the `/ionadmin/security/role` page.

Goes to a new page, where you must specify the role ID in English. Click on the "Save" button to confirm the creation of the specified role.

2) Role editing. Choose the desired role and press the "Edit" button on the `/ionadmin/security/role` page to edit the role.

Goes to a new page, where the following fields are displayed on the form:

`Identifier` - expression in English to assign a unique role name. When it changes, the rights of users who previously tied this role with the old identifier may be invalid. It is then necessary for each user to assign the role again.

`Name` - is the role's name that can contains the exressions in Russian. 

`Access rights` - tabs for rights distribution:
- General - while used to distribute the access roles to all resources (* - all resources)

- Navigation - used to distribute the role access to the menu of the registry module. First, the system name of the project is displayed, which has a plus sign to display internal and imported resources. Distributed at this point so far only the rights to read the menu.

- Classes - used to distribute the role access to metadata classes. First, the system name of the project is displayed, which has a plus sign to display internal and imported resources. For these resources, you can set separate rights.

3) Deleting the role. To delete a role select the required role and click the "Delete" button on the page `/ ionadmin / security / role`.

Confirm the removal of the role.

### Resource access

 When managing roles in access rights, the following access is provided to each resource:

| Access | Description |
|-----|:-----|
| Full access | Includes all other accesses. You cannot select full access and no additional access for reading, editing, deleting or using. Access to read the resource is only provided for navigation. |
| Read only | The ability to read resource objects |
| Edit | The ability to edit resource objects, not used for navigation |
| Delete | Ability to delete resource objects, not used for navigation |
| Create | Ability to create resource objects, not used for navigation |

Access can be assigned to the entire resource group or separate checkboxes for each resource access.

## User administration

On the `/ ionadmin / security / user` page you can create, edit or delete users.

1) Create a user. Press the "Create" button on the `/ionadmin/security/user` page to create a user.

Goes to a new page, where you need to specify the username in English, password, description in the name. Click on the "Save" button to confirm the creation of the specified user.

2) Editing the user. Select the required user and press the "Edit" button on the page `/ ionadmin / security / user` to edit the user.

Goes to a new page, where the following fields are displayed:

`Тип` - type of user account, only local users are available in the admin panel.

`Логин` - user id in english.

`Пароль` - user password.

`Имя` - name of the user may contain expressions in Russian, for example, Surname N.P.

`Роли` - list of user roles. If the role is ticked, the role is tied to the user.

3) Deleting the user. Choose the user and press the "Delete" button on the `/ionadmin/security/user` page to delete the user.

Confirm the deletion of the user.

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md)&ensp;  [Contact us](https://iondv.ru/index.html) &ensp;  [Russian](/docs/ru/3_modules_description/admin_security.md) &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 LLC "ION DV".   
All rights reserved.

