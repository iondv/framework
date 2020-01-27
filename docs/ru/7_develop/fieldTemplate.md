# Шаблоны полей ввода данных в веб-форме
Шаблоны предназначены для задания пользовательских параметров построения полей ввода данных в веб-форме.  
Для подключения шаблона к полю веб-формы, необходимо указать его в опциях соответствующего поля json формы:
```json
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
Внутри скрипта доступны некоторые элементы веб-формы, подробнее: [Опции](../2_system_description/metadata_structure/meta_view/options.md).

Пример скрипта для автоматической замены в текстовом поле ввода нижнего регистра букв на верхний и буквы "ö" на "o":
```js
<div class="form-group <%= field.required ? 'required' : '' %>">
    <script>
    </script>
    <label for="a_khv-ticket-discount_applicant_<%= prop.getName().toLowerCase() %>" class="col-md-2 col-sm-3 control-label"><%= prop.getCaption() %>
    </label>
     <div class="col-sm-9">
         <input id="a_khv-ticket-discount_applicant_<%= prop.getName().toLowerCase() %>" type="text" class="form-control attr-value" name="<%= prop.getName().toLowerCase() %>" data-mask="{&quot;regex&quot;:&quot;[ёЁа-яА-Я .-]{1,50}&quot;}" placeholder="<%= prop.getCaption() %>" value="" im-insert="true">
         <script>
             if (typeof inputField !== 'object') {inputField = [];}
             propName = '<%= prop.getName().toLowerCase() %>';
             inputField['<%= prop.getName().toLowerCase() %>'] = document.getElementById(`a_khv-ticket-discount_applicant_${propName}`);
             inputField['<%= prop.getName().toLowerCase() %>'].addEventListener('focusout', () => {
                 inputValue = inputField['<%= prop.getName().toLowerCase() %>'].value;
                 while ((/[Ö]/).test(inputValue)) {inputValue = inputValue.replace(/[Ö]/,'O');}
                 while ((/[ö]/).test(inputValue)) {inputValue = inputValue.replace(/[ö]/,'o');}
                 while ((/[a-z]/).test(inputValue)) {inputValue = inputValue.toUpperCase();}
                 //(/[a-z]/).test(inputValue[0]) ? inputValue = inputValue[0].toUpperCase() + inputValue.substring(1) : ""; - capitalize only first letter
                 inputField['<%= prop.getName().toLowerCase() %>'].value = inputValue;
             })
         </script>
     </div>
</div>
``` 