# Заголовок страницы - `"title"`
 
 _В процессе реализации - таск:_ https://ion-dv.atlassian.net/browse/IONCORE-81
 
Для формирования заголовка страницы в первую очередь используется значение данного поля меты узла навигации.  
Если поле `"title"` не задано - пустая строка, для формирования заголовка страницы используется поле `"caption"` меты узла навигации.  
Для формирования заголовка страницы на страницах списка выбора (при открытии списка класса справочника из форм) используется `"caption"` общей части меты класса.  

## JSON

```
{
  "code": "navigation_fields.title.titleInTitle",
  "orderNumber": 0,
  "type": 1,
  "title": "Заголовок в поле \"title\" - отличается от наименования узла навигации",
  "caption": " в поле \"title\"",
  "classname": "title",
  "container": null,
  "collection": null,
  "url": null,
  "hint": null,
  "conditions": [],
  "sorting": [],
  "pathChains": []
}
```

## Реализация в мете D&T 

1. Заголовок в `"caption"` узла навигации: http://raw.dnt.local/registry/develop-and-test@navigation_fields.title.titleInCaption
2. Заголовок в `"title"` узла навигации: http://raw.dnt.local/registry/develop-and-test@navigation_fields.title.titleInTitle
3. Заголовок в `"caption"` общей части меты класса: http://raw.dnt.local/registry/develop-and-test@navigation_fields.title.titleInReference (что бы увидеть нужный заголовок, необходимо начать создание нового объекта класса по ссылке и активировать выбор объекта из справочника).

