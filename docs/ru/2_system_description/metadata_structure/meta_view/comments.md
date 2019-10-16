#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [Проектные документы](fileshare.md)

# Представление `Комментарий` для атрибутов типа "Коллекция"

:warning: Для корректной работы функционала обязательно в зависимостях проекта должен быть указан репозиторий  `viewlib`. Подключение:
1. В файле **package.json** проекта:

```json
...
"ionMetaDependencies": {
    "viewlib": "0.7.1"
  }
...
```
2. В директорию **application** рядом с текущим проектом добавить репозиторий проекта `viewlib`

## Инструкция по подключению функционала

Представление реализуется посредством шаблона `templates/registry/item_footer.ejs` вида обратите внимание на пояснение строк после знака **//** :

```
ejs
<%
let status = item.get('status'); // атрибут со статусом БП
let readOnly = state === 'conf' || status === 'approv'; //статус в котором отображаем коллекцию на форме
if ((item.getMetaClass().checkAncestor('classColl@ns')) //класс, в котором содержится атрибут Комментарий
  && item.getItemId() && (status === 'onapprov' || readOnly)) { // статус, на котором атрибут отображается только для чтения
  let comments = resolveTpl('comments', null, true);
  if (comments) {
    let prop = item.property('atrClassColl'); //системное имя атрибута с представлением Комментарий
    let commId = `${form.ids.attr}_${prop.getName()}_сom`;
%>

<div class="line-tabs tabs">

  <div id="item-footer-order-toggle" class="order-toggle asc" data-direction="asc"
       title="Изменить порядок в списке">
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
          comment: { // атрибуты для класса по ссылке из атрибута Коллекции
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
### Настройка `"options"`

Далее подключаем функционал `"options"` для представление Комментарий на форме представления изменения для атрибута типа "Коллекция":

```json
{
          "caption": "Коментарий",
          "type": 3,
          "property": "coment",
          "size": 2,
          "maskName": null,
          "mask": null,
          "mode": 3,
          "fields": [],
          "columns": [
            {
              "sorted": true,
              "caption": "Дата",
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
              "caption": "Подтверждение (Обоснование)",
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
              "caption": "Ведущий",
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
              "caption": "Создать",
              "visibilityCondition": null,
              "enableCondition": null,
              "needSelectedItem": false,
              "signBefore": false,
              "signAfter": false,
              "isBulk": false
            },
            {
              "id": "EDIT",
              "caption": "Править",
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
              "textProperty": "descript", // атрибут "Описание" из класса по ссылке
              "userProperty": "owner", // атрибут "Ответственный" из класса по ссылке (отображается имя пользователя, оставившего комментарий)
              "parentProperty": "answlink", // атрибут "Ответ" из класса по ссылке (для возможности "Ответить" на комментарий пользователя)
              "photoProperty": "owner_ref.foto.link", // атрибут "Фото" из класса Персона (отображается фото персоны)
              "dateProperty": "date" // атрибут "Дата" из класса по ссылке
            }
          }
        }
```

## Особенности 

### Mета класса с атрибутом типа "Коллекция" с представлением Комментарий

1. В классе создается обычный атрибут с типом "Коллекция".
2. В представлении формы изменения создается аналогично стандартному атрибуту с типом "Коллекция", но с добавлением настройки `"options"`, подробнее смотрите [настройка "options"](comments.md#настройка-options).
### Mета класса по ссылке из атрибута типа "Коллекция" с представлением Комментарий

1. В классе создается атрибутивный состав и их системные наименования **обязательно** должны соответствовать наименованиям в шаблоне `item_footer.ejs` и в свойстве `"options"`. Дополнительно к обязательным - класс может содержать любые атрибуты. 

### Мета дополнительных классов

1. Класс Персона должен содержать атрибут, в которых будет задаваться информация об имени пользователя (в данном случае это атрибут "user") и фотография персоны (атрибут "Фото"), а так же ФИО персоны, которые являются семантикой данного класса. 

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
    "caption": "Персона",
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
        "caption": "Идентификатор",
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
        "caption": "Фамилия",
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
        "caption": "Имя",
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
        "caption": "Отчество",
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
        "caption": "Пользователь",
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
        "caption": "Фотография",
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

### Следующая страница: [Типы представлений](view_types.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_view/comments.md)   &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>         



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 