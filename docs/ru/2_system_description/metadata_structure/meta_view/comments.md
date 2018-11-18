#### [Оглавление](/docs/ru/index.md)

### Предыдущая страница: [CSS поля](/docs/ru/2_system_description/metadata_structure/meta_view/tags.md)

## Представление *Комментарий* для атрибутов типа "Коллекция"

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

### Инструкция по подключению функционала

Реализуется представление шаблоном `templates/registry/item_footer.ejs` вида (обратить внимание на пояснение срок после знака **//** :

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
              "parentProperty": "answlink", // атрибут "Ответ" из класса по ссылке (для возможности "Отметить" на комментарий пользователя)
              "photoProperty": "owner_ref.foto.link", // атрибут "Фото" из класса Персона (отображается фото персоны)
              "dateProperty": "date" // атрибут "Дата" из класса по ссылке
            }
          }
        }
```

### Особенности меты для корректной работы функционала

##### мета класса, содержащего в себе атрибут типа "Коллекция" с представлением Комментарий

1. В классе создается обычный атрибут с типом "Коллекция" [Пример] (http://git.local/ION-APP/develop-and-test/blob/develop/meta/classColl@develop-and-test.class.json)
2. В представлении формы изменения создается аналогично стандартному атрибуту с типом "Коллекция", но с добавлением настройки `"options"` (описана выше) [Пример] (http://git.local/ION-APP/develop-and-test/blob/develop/views/verification@develop-and-test/item.json)

##### мета класса по ссылке из атрибута типа "Коллекция" с представлением Комментарий

1. В классе атрибутивный состав и их системные наименования **обязательно** должны соответствовать наименованиям в шаблоне `item_footer.ejs` и в свойстве `"options"`. Дополнительно к обязательным - класс может содержать любые атрибуты. [Пример] (http://git.local/ION-APP/develop-and-test/blob/develop/meta/verification@develop-and-test.class.json)

##### мета дополнительных необходимых классов

1. класс Персона должен содержать атрибут, в которых будет задаваться информация об имени пользователя (в данном случае это атрибут "user") и фотография персоны (атрибут "Фото"), а так же ФИО персоны, которые являются семантикой данного класса. [Пример] (http://git.local/ION-APP/develop-and-test/blob/develop/meta/person@develop-and-test.class.json)

### Следующая страница: [Проектные документы](/docs/ru/2_system_description/metadata_structure/meta_view/fileshare.md)

--------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md) &ensp;  [Contact us](https://iondv.com) &ensp;  [English](/docs/en/2_system_description/metadata_structure/meta_view/comments.md)   &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 