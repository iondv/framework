#### [Content](/docs/en/index.md)

### Back: [Modules](/docs/en/3_modules_description/modules.md)

# Portal module structure

**The portal module** – is a module for displaying arbitrary data templates. The portal module performs the function of displaying the design of various information using markup language *Markdown* and *HTML*.


## Structure

View layer - is responsible for displaying data:

1. `Adapter Provider` - performs the function of connection between the data and their display on the portal (sets in the 'deploy.json' file).
2. `File Adapter` - returns the resources of "File" type (remains in the memory of the application).
3. `Class Adapter` - designed to display data from the database through the data repository (updated each time).

## The logic of displaying data on the portal

#### Portal styles

CSS (cascading style sheets) are used to describe/design the portal pages.
An example of the portal page design in Dnt - /develop-and-test/portal/view/static/css/style.css

Possible options for applying styles are set in this folder - *portal/view/static/style.css*.

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

#### Portal pages

Portal page templates are configured in the * portal / view / templates * folder.

The location of objects on the page is described in a HTML markup language:

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

* The`<head>` tag contains displaying styles for the appearance of the portal.

* The `<body>` tag containsinformation about the objects displayed on the portal page.

* The `<script>` tag contains information in the form of a link to a program or its text in a specific language. Scripts can be placed in an external file and linked to any HTML document, which allows you to use the same functions on several web pages, thereby speeding up their loading. In this case, the `<script>` tag is used with the `src` attribute, which points to the address of the script from an external file to import into the current document.

#### Portal navigation

A portal navigation meta is a set of navigation nodes, each of which has a specified resource type.

Example of the navigation section:

```json
{
  "code": "main",
  "caption": "Main menu",
  "itemType": "section",
  "subNodes":["classes", "texts"]
}
```
* code - system object name
* caption - logical object name
* itemType - object display type
* subNodes - array of navigation nodes of this section

An example of creating a navigation node:

```json
{
  "code": "texts",
  "caption": "Text publication",
  "resources": "texts",
  "PageSize": 5,
  "itemType": "node"
}
```
* code - system object name
* caption - logical object name
* resources - turning data into a portal content
* PageSize - page size
* itemType -  object display type

#### Styling data


1. The format of paging information
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

2. The format of the correct display of the text of errors 

```
<% layout('./layout/layout') %>
<div class="container">
  <h1>404</h1>
  <h2>the page was not found</h2>
</div>
```

3. The format for converting data to portal content

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

4. The format of the text display

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


 #### [Licence](/LICENCE.md)&ensp;  [Contact us](https://iondv.ru/index.html) &ensp;  [Russian](/docs/ru/3_modules_description/portal.md) &ensp; [FAQs](/faqs.md)   <div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>       



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV".**   
All rights reserved. 