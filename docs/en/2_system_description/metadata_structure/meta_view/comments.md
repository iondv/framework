#### [Content](/docs/en/index.md)

### The previous page: [Maintenance of project documents](fileshare.md)

# Comments for attributes of the "Collection" type

:warning: The `viewlib` repository must be specified in the project dependencies for the functionality to work correctly. 

Configuration:

1. In the **package.json** file of the project

```json
...
"ionMetaDependencies": {
    "viewlib": "0.7.1"
  }
...
```
2. In the **application** directory next to the current project add the repository of the `viewlib` project

## How to configure the functionality? 

The view is realized using the template of `templates / registry / item_footer.ejs` form. Please note the comments fot the lines after the **//** sign:

```
ejs
<%
let status = item.get('status'); // attribute with the WorkFlow status
let readOnly = state === 'conf' || status === 'approv'; // status to display the collection on the form 
if ((item.getMetaClass().checkAncestor('classColl@ns')) // class with the "Comment" attribute
  && item.getItemId() && (status === 'onapprov' || readOnly)) { // status to display the readonly attribute
  let comments = resolveTpl('comments', null, true);
  if (comments) {
    let prop = item.property('atrClassColl'); // system name of the attribute with the "Comment" view
    let commId = `${form.ids.attr}_${prop.getName()}_сom`;
%>

<div class="line-tabs tabs">

  <div id="item-footer-order-toggle" class="order-toggle asc" data-direction="asc"
       title="Change list order">
    <span class="glyphicon"></span>
  </div>

  <ul class="nav nav-tabs">
    <li class="active">
      <a href='#footer-tab-1' data-toggle="tab">
        <%- prop.getCaption() %>
      </a>
    </li>
  </ul>

  <div class="tab-content">
    <div id="footer-tab-1" class="tab-pane active">
      <div class="comments">
        <%-partial(comments, {
          item,
          id: commId,
          property: prop,
          comment: { // attributes for the class by reference from the "Collection" attribute
            text: 'descript',
            user: 'owner',
            parent: 'answlink',
            photo: 'owner_ref.foto.link'
          },
          count: 100,
          orderToggleId: '#item-footer-order-toggle',
          readOnly
        })%>
      </div>
    </div>
  </div>
</div>

<script>
  $(function () {
    $('#<%= commId %>').on('comment-added comment-deleted', function () {
      loadWorkflowState();
    });
  });
  $('#item-footer-order-toggle').click(function () {
    if ($(this).hasClass('asc')) {
      $(this).removeClass('asc').addClass('desc').data('direction', 'desc');
    } else {
      $(this).removeClass('desc').addClass('asc').data('direction', 'asc')
    }
  });
  $(document.body).on('mouseenter', '.item-comment', function () {
    $(this).addClass('mouse-enter');
  });
  $(document.body).on('mouseleave', '.item-comment', function () {
    $(this).removeClass('mouse-enter');
  });
</script>
<% }} %>
```
### The `"options"` configuration

Next, configure the functionality of `"options"` for the "Comment" view on the edit form for the attribute of the "Collection" type:

### JSON
```
{
          "caption": "Comment",
          "type": 3,
          "property": "comment",
          "size": 2,
          "maskName": null,
          "mask": null,
          "mode": 3,
          "fields": [],
          "columns": [
            {
              "sorted": true,
              "caption": "Date",
              "type": 120,
              "property": "date",
              "size": 2,
              "maskName": null,
              "mask": null,
              "mode": null,
              "fields": [],
              "columns": [],
              "actions": null,
              "commands": null,
              "orderNumber": 2,
              "required": false,
              "visibility": null,
              "enablement": null,
              "obligation": null,
              "readonly": false,
              "selectionPaginated": true,
              "validators": null,
              "hint": "",
              "historyDisplayMode": 0,
              "tags": null,
              "selConditions": null,
              "selSorting": null
            },
            {
              "sorted": true,
              "caption": "Confirmation (Rationale)",
              "type": 7,
              "property": "descript",
              "size": 2,
              "maskName": null,
              "mask": null,
              "mode": null,
              "fields": [],
              "hierarchyAttributes": null,
              "columns": [],
              "actions": null,
              "commands": null,
              "orderNumber": 1,
              "required": true,
              "visibility": null,
              "enablement": null,
              "obligation": null,
              "readonly": false,
              "selectionPaginated": true,
              "validators": null,
              "hint": null,
              "historyDisplayMode": 0,
              "tags": null,
              "selConditions": null,
              "selSorting": null
            },
            {
              "caption": "Lead",
              "type": 2,
              "property": "owner",
              "size": 2,
              "maskName": null,
              "mask": null,
              "mode": 1,
              "fields": [],
              "hierarchyAttributes": null,
              "columns": [],
              "actions": null,
              "commands": null,
              "orderNumber": 6,
              "required": false,
              "visibility": null,
              "enablement": null,
              "obligation": null,
              "readonly": false,
              "selectionPaginated": true,
              "validators": null,
              "hint": null,
              "historyDisplayMode": 0,
              "tags": null
            }
          ],
          "actions": null,
          "commands": [
            {
              "id": "CREATE",
              "caption": "Create",
              "visibilityCondition": null,
              "enableCondition": null,
              "needSelectedItem": false,
              "signBefore": false,
              "signAfter": false,
              "isBulk": false
            },
            {
              "id": "EDIT",
              "caption": "Edit",
              "visibilityCondition": null,
              "enableCondition": null,
              "needSelectedItem": true,
              "signBefore": false,
              "signAfter": false,
              "isBulk": false
            }
          ],
          "orderNumber": 80,
          "required": false,
          "visibility": null,
          "enablement": null,
          "obligation": null,
          "readonly": false,
          "selectionPaginated": true,
          "validators": null,
          "hint": "",
          "historyDisplayMode": 0,
          "tags": null,
          "options": {
            "template": "comments",
            "comments": {
              "textProperty": "descript", // "Description" attribute from the class by reference 
              "userProperty": "owner", // "Owner" attribute from the class by reference (the name of the user who left the comment is displayed)
              "parentProperty": "answlink", // "Answear" attribute from the class by reference (to answear the user comment)
              "photoProperty": "owner_ref.foto.link", // "Photo" attribute from the "Person" class (photo of the person is displayed)
              "dateProperty": "date" // "Date" attribute from the class by reference 
            }
          }
        }
```

## Features 

### Meta class with the attribute of the "Collection" type with the "Comment" view

1. Create an attribute of the "Collection" type.
2. In the edit view form, create an attribute of the "Collection" type as usual but with the `"options"` setting, see the ["options" configuration](comments.md#the-options-configuration) for more details.

### Meta class by reference from the attribute of the "Collection" type with the "Comment" view 

1. An attribute composition and their system names **must** match the names in the `item_footer.ejs` template and in the `"options"` property. In addition to the mandatory attributes - class can contain any other attributes.

### Meta of additional classes 

1. The "Person" class must contain an attribute to specify the user name (in this case, this is the "user" attribute) and a photo of the person ("Photo" attribute), as well as the Surname, first name & patronymic of the person which are the semantics of this class.
```
{
    "namespace": "develop-and-test",
    "isStruct": false,
    "key": [
      "id"
    ],
    "semantic": "surname| |name| |patronymic",
    "name": "person",
    "version": "",
    "caption": "Person",
    "ancestor": null,
    "container": null,
    "creationTracker": "",
    "changeTracker": "",
    "creatorTracker": "",
    "editorTracker": "",
    "history": 0,
    "journaling": true,
    "compositeIndexes": [],
    "properties": [
      {
        "orderNumber": 10,
        "name": "id",
        "caption": "Identifier",
        "type": 12,
        "size": 24,
        "decimals": 0,
        "allowedFileTypes": null,
        "maxFileCount": 0,
        "nullable": false,
        "readonly": true,
        "indexed": false,
        "unique": true,
        "autoassigned": true,
        "hint": null,
        "defaultValue": null,
        "refClass": "",
        "itemsClass": "",
        "backRef": "",
        "backColl": "",
        "binding": "",
        "semantic": null,
        "selConditions": [],
        "selSorting": [],
        "selectionProvider": null,
        "indexSearch": false,
        "eagerLoading": false,
        "formula": null
      },
      {
        "orderNumber": 20,
        "name": "surname",
        "caption": "Surname",
        "type": 0,
        "size": null,
        "decimals": 0,
        "allowedFileTypes": null,
        "maxFileCount": 0,
        "nullable": true,
        "readonly": false,
        "indexed": true,
        "unique": false,
        "autoassigned": false,
        "hint": null,
        "defaultValue": null,
        "refClass": "",
        "itemsClass": "",
        "backRef": "",
        "backColl": "",
        "binding": "",
        "semantic": null,
        "selConditions": [],
        "selSorting": [],
        "selectionProvider": null,
        "indexSearch": false,
        "eagerLoading": false,
        "formula": null
      },
      {
        "orderNumber": 30,
        "name": "name",
        "caption": "Name",
        "type": 0,
        "size": null,
        "decimals": 0,
        "allowedFileTypes": null,
        "maxFileCount": 0,
        "nullable": true,
        "readonly": false,
        "indexed": true,
        "unique": false,
        "autoassigned": false,
        "hint": null,
        "defaultValue": null,
        "refClass": "",
        "itemsClass": "",
        "backRef": "",
        "backColl": "",
        "binding": "",
        "semantic": null,
        "selConditions": [],
        "selSorting": [],
        "selectionProvider": null,
        "indexSearch": false,
        "eagerLoading": false,
        "formula": null
      },
      {
        "orderNumber": 40,
        "name": "patronymic",
        "caption": "Patronymic",
        "type": 0,
        "size": null,
        "decimals": 0,
        "allowedFileTypes": null,
        "maxFileCount": 0,
        "nullable": true,
        "readonly": false,
        "indexed": true,
        "unique": false,
        "autoassigned": false,
        "hint": null,
        "defaultValue": null,
        "refClass": "",
        "itemsClass": "",
        "backRef": "",
        "backColl": "",
        "binding": "",
        "semantic": null,
        "selConditions": [],
        "selSorting": [],
        "selectionProvider": null,
        "indexSearch": false,
        "eagerLoading": false,
        "formula": null
      },
      {
        "orderNumber": 40,
        "name": "user",
        "caption": "User",
        "type": 18,
        "size": null,
        "decimals": 0,
        "allowedFileTypes": null,
        "maxFileCount": 0,
        "nullable": true,
        "readonly": false,
        "indexed": true,
        "unique": false,
        "autoassigned": false,
        "hint": null,
        "defaultValue": null,
        "refClass": "",
        "itemsClass": "",
        "backRef": "",
        "backColl": "",
        "binding": "",
        "semantic": null,
        "selConditions": [],
        "selSorting": [],
        "selectionProvider": null,
        "indexSearch": false,
        "eagerLoading": false,
        "formula": null
      },
      {
        "orderNumber": 70,
        "name": "foto",
        "caption": "Photo",
        "type": 5,
        "size": null,
        "decimals": 0,
        "allowedFileTypes": null,
        "maxFileCount": 0,
        "nullable": true,
        "readonly": false,
        "indexed": false,
        "unique": false,
        "autoassigned": false,
        "hint": null,
        "defaultValue": null,
        "refClass": "",
        "itemsClass": "",
        "backRef": "",
        "backColl": "",
        "binding": "",
        "semantic": null,
        "selConditions": [],
        "selSorting": [],
        "selectionProvider": null,
        "indexSearch": false,
        "eagerLoading": false,
        "formula": null
      }  
    ],
    "metaVersion": "2.0.61.21119"
  }

```

### The next page: [View types](view_types.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [Russian](/docs/ru/2_system_description/metadata_structure/meta_view/comments.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 