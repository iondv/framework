#### [Оглавление](/docs/ru/index.md)

### Назад: [Модули](modules.md)

# Структура модуля портала

**Модуль портала (portal)** – модуль, предназначенный для отображения произвольных шаблонов данных. Модуль портала выполняет функцию отображения дизайна различной информации с помощью языка разметки *Markdown* и *HTML*.


## Состав
Слой представления - отвечает за отображение данных:

1. `Adapter Provider` - выполняет функцию связи между данными и отображением их на портале (настройка через файл 'deploy.json')
2. `File Adapter` - возвращает ресурсы типа "Файл" (остается в памяти приложения)
3. `Class Adapter` - предназначен для отображения данных из базы через репозиторий данных (каждый раз обновляются)

## Логика отображения данных на портале

#### Стили портала

Для описания/оформления внешнего вида страниц портала применяются CSS (каскадные таблицы стилей)
Пример оформления страницы портала в Dnt - /develop-and-test/portal/view/static/css/style.css

Возможные варианты для применения стилей задаются в папке *portal/view/static/style.css*.

```css
.navbar {
  border-radius: 0;
  margin-bottom: 0;
}

.navbar .navbar-brand {
  padding: 5px;
}
...
```

#### Страницы портала

Шаблоны страниц портала настраиваются в папке *portal/view/templates*. 

Расположение объектов на странице описывается в формате языка разметки HTML:

```html
<html>
<head>
  <title><%= portal %></title>
  <link href="/<%= module %>/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet">
  <link href="/<%= module %>/dnt/css/style.css" rel="stylesheet">
</head>
<body>
  <%- partial('../parts/menu', { menu }) %>
  <%- body -%>
  <script src="/<%= module %>/vendor/jquery/jquery.min.js"></script>
  <script src="/<%= module %>/vendor/bootstrap/js/bootstrap.min.js"></script>
  <script src="/<%= module %>/js/scripts.js"></script>
</body>
</html>
```

* Содержание тега `<head>` включает в себя отображение стилей оформления внешнего вида портала.

* В тег `<body>` включается информация об объектах, отображаемых на странице портала.

* Тег `<script>` содержит в себе информацию в виде ссылки на программу или ее текст на определенном языке. Скрипты могут располагаться во внешнем файле и связываться с любым HTML-документом, что позволяет использовать одни и те же функции на нескольких веб-страницах, тем самым ускоряя их загрузку. В данном случае тег `<script>` применяется с атрибутом `src`, который указывает на адрес скрипта из внешнего файла для импорта в текущий документ.

#### Навигация портала

Мета навигации портала представляет собой набор узлов навигации, у каждого из которых указан тип ресурса.

Пример создания секции навигации:

```json
{
  "code": "main",
  "caption": "Главное меню",
  "itemType": "section",
  "subNodes":["classes", "texts"]
}
```
* code - системной имя объекта
* caption - логическое имя объекта
* itemType - тип отображения объекта
* subNodes - массив узлов навигации, содержащихся в данной секции

Пример создания узла навигации:

```json
{
  "code": "texts",
  "caption": "Публикация текстов",
  "resources": "texts",
  "PageSize": 5,
  "itemType": "node"
}
```
* code - системное имя объекта
* caption - логическое имя объекта
* resources - превращение данных в контент портала
* PageSize - размер страницы
* itemType -  тип отображения объекта

#### Оформление данных


1. Формат разбиения информации на страницы
```
<% layout('./layout/content') %>
  <%
  if (Array.isArray(resources) && resources.length) {
    resources.forEach(function(resource){
  %>
  <div>
   <h3 id="<%= node.code %>_<%= resource.getId() %>">
     <a href="/<%= module %>/<%= node.code %>/<%= resource.getId() %>">
       <%= resource.getTitle() %>
     </a>
     <%
       var formatedDate = null;
       var date = resource.getDate();
       if (date) {
          formatedDate = date.toLocaleString('ru',{year: 'numeric', month: 'numeric', day: 'numeric'});
       }
       %>
     <% if (formatedDate) { %><small><%= formatedDate %></small><% } %>
   </h3>
   <p><%- resource.getContent() %></p>
  </div>
  <%
    })
  }
  %>
<%- partial('./parts/pagination', { resources }) %>
```

2. Формат корректного отображения текста ошибок 

```
<% layout('./layout/layout') %>
<div class="container">
  <h1>404</h1>
  <h2>Страница не найдена</h2>
</div>
```

3. Формат преобразования данных в контент портала 

```
<% layout('./layout/layout') %>

<div class="container">

  <div class="row">
    <div class="col-md-12">
      <div class="page-header">
        <h2><%= resource.getTitle() %></h2>
      </div>
      <div>
        <%
        var formatedDate = null;
        var date = resource.getDate();
        if (date) {
          formatedDate = date.toLocaleString('ru',{year: 'numeric', month: 'numeric', day: 'numeric'});
        }
        %>
        <% if (formatedDate) { %><h1><small><%= formatedDate %></small></h1><% } %>
      </div>
      <div>
        <%- resource.getContent() %>
      </div>
    </div>
  </div>

</div>
```

4. Формат отображения текста

```
<% layout('./layout/layout') %>

<div class="container">

  <div class="row">
    <div class="col-md-12">
      <div>
        <%
        var formatedDate = null;
        var date = resource.getDate();
        if (date) {
          formatedDate = date.toLocaleString('ru',{year: 'numeric', month: 'numeric', day: 'numeric'});
        }
        %>
        <% if (formatedDate) { %><h1><small><%= formatedDate %></small></h1><% } %>
      </div>
      <div>
        <%- resource.getContent() %>
      </div>
    </div>
  </div>

</div>
```

--------------------------------------------------------------------------  


 #### [Licence](/LICENSE)&ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/docs/en/3_modules_description/portal.md) &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>         



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV".**   
All rights reserved. 