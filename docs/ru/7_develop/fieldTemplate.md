# Шаблоны полей ввода данных в веб-форме
Шаблоны предназначены для задания пользовательских параметров построения полей ввода данных в веб-форме.  
Для подключения шаблона к полю веб-формы, необходимо указать его в опциях соответствующего поля json формы:
```js
{
  "tabs": [
    {
      "caption": "General info",
      "fullFields": [
        {
          "property": "surname",
          "caption": "Surname",
          //...
          "options": {
            "template": "capitalize"
          },
          "tags": ""
        },
```

Шаблоны в формате `.ejs` загружаются по пути, указанном в `modules.registry.globals.templates` из `deploy.json`.  
Например, если указан путь `applications/khv-ticket-discount/templates/registry`, то в прошлом примере для поля `property` будет загружен скрипт `applications/khv-ticket-discount/templates/registry/capitalize.ejs`.  
  
Скрипт будет выполнен при загрузке поля в веб-форме. Синтаксис стандартный для ejs.    
Внутри скрипта доступны некоторые элементы веб-формы, подробнее: [Опции](docs/ru/2_system_description/metadata_structure/meta_view/options.md).

Пример скрипта для автоматической замены в текстовом поле ввода нижнего регистра букв на верхний и буквы "ö" на "o":
```html
<% wfState = item.base.state %>
<div class="form-group <%= wfState === 'edit' || item.id === null ? (field.required ? 'required' : '') : '' %> " style data-type="<%= wfState === 'edit' || item.id === null  ? 'input' : 'static' %>" data-name="<%= prop.getName().toLowerCase() %>" data-prop="<%= JSON.stringify(field) %>" >
    <label for="a_khv-ticket-discount_<%= item.getClassName().split('@')[0] %>_<%= prop.getName().toLowerCase() %>" class="col-md-2 col-sm-3 control-label"><%= prop.getCaption() %>
    </label>
     <div class="col-sm-9">
         <input id="a_khv-ticket-discount_<%= item.getClassName().split('@')[0] %>_<%= prop.getName().toLowerCase() %>" type="<%= wfState === 'edit' || item.id === null ? 'text' : 'hidden' %>" class="form-control attr-value" name="<%= prop.getName().toLowerCase() %>" data-mask="{&quot;regex&quot;:&quot;[öÖa-zA-Z .-]{1,50}&quot;}" placeholder="<%= prop.getCaption() %>" value="<%= prop.getValue() !== null ? prop.getValue() : "" %>" im-insert="true">
         <% if(wfState === 'done' && item.id !== null) { %>
             <div class="form-control-static"><%= prop.getValue() %></div>
         <% } %>
         <script>
             if (typeof inputField !== 'object') {inputField = [];}
             propName = '<%= prop.getName().toLowerCase() %>';
             inputField['<%= item.getClassName().split('@')[0] %><%= prop.getName().toLowerCase() %>'] = document.getElementById(`a_khv-ticket-discount_<%= item.getClassName().split('@')[0] %>_${propName}`);
             inputField['<%= item.getClassName().split('@')[0] %><%= prop.getName().toLowerCase() %>'].addEventListener('focusout',applyStyle)
             inputField['<%= item.getClassName().split('@')[0] %><%= prop.getName().toLowerCase() %>'].addEventListener('keyup', applyStyle)
             inputField['<%= item.getClassName().split('@')[0] %><%= prop.getName().toLowerCase() %>'].addEventListener('keydown', applyStyle)
             inputField['<%= item.getClassName().split('@')[0] %><%= prop.getName().toLowerCase() %>'].addEventListener('paste', applyStyle)
             function applyStyle() {
                 while ((/[Ö]/).test(inputField['<%= item.getClassName().split('@')[0] %><%= prop.getName().toLowerCase() %>'].value)) {
                     inputField['<%= item.getClassName().split('@')[0] %><%= prop.getName().toLowerCase() %>'].value = inputField['<%= item.getClassName().split('@')[0] %><%= prop.getName().toLowerCase() %>'].value.replace(/[Ö]/, 'O');
                 }
                 while ((/[ö]/).test(inputField['<%= item.getClassName().split('@')[0] %><%= prop.getName().toLowerCase() %>'].value)) {
                     inputField['<%= item.getClassName().split('@')[0] %><%= prop.getName().toLowerCase() %>'].value = inputField['<%= item.getClassName().split('@')[0] %><%= prop.getName().toLowerCase() %>'].value.replace(/[ö]/, 'o');
                 }
                 while ((/[a-z]/).test(inputField['<%= item.getClassName().split('@')[0] %><%= prop.getName().toLowerCase() %>'].value)) {
                     inputField['<%= item.getClassName().split('@')[0] %><%= prop.getName().toLowerCase() %>'].value = inputField['<%= item.getClassName().split('@')[0] %><%= prop.getName().toLowerCase() %>'].value.toUpperCase();
                 }
                 //(/[а-я]/).test(inputField['<%= item.getClassName().split('@')[0] %><%= prop.getName().toLowerCase() %>'].value[0]) ? inputField['<%= item.getClassName().split('@')[0] %><%= prop.getName().toLowerCase() %>'].value = inputField['<%= item.getClassName().split('@')[0] %><%= prop.getName().toLowerCase() %>'].value[0].toUpperCase() + inputField['<%= item.getClassName().split('@')[0] %><%= prop.getName().toLowerCase() %>'].value.substring(1) : ""; - только первая буква}
             }
         </script>
     </div>
</div>
``` 