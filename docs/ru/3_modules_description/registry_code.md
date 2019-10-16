#### [Оглавление](/docs/ru/index.md)

### Назад: [Модуль регистра](registry.md)

# Логика формирования id элементов связанных с объектами по типам

## Реализовано

### INPUT, SELECT, TEXTAREA

**1.** Для редактирования атрибута объекта `a_{неймспейс, класс, атрибут}`

```
<input type="text" class="form-control" id="a_develop-and-test_class_integer_integer_integer" name="integer_integer" pattern="[0-9]+([\.|,][0-9]+)?" value="5120">
```

### BUTTON

**1.** действие списка `la_{неймспейс, класс, имя команды}`

```
<button id="la_develop-and-test_class_integer_edit" class="edit btn btn-info command" title="Редактировать" data-id="EDIT" style="display: inline-block;">Править</button>
```

**2.** действие формы `fa_{неймспейс, класс, имя команды}`

```
<button id="fa_develop-and-test_class_integer_saveandclose" data-id="SAVEANDCLOSE" type="button" class="btn command object-control SAVEANDCLOSE" style="">
        Сохранить и Закрыть
      </button>
```

**3.** действие ссылочного поля `ra_{неймспейс, класс, атрибут, имя команды}`

```
<button id="ra_develop-and-test_ref_use_ref_use_create" type="button" class="create-btn btn btn-success" data-ref-property="ref_use" title="Создать">
                    <span class="glyphicon glyphicon-plus-sign"></span>
                </button>
```

**4.** действие поля коллекции `ca_{неймспейс, класс, атрибут, имя команды}` *нет возможности проверить, коллекции в процессе*

**5.** плавающие кнопки формы `ffa_{неймспейс, класс, атрибут, имя команды}`

```
<button id="ffa_develop-and-test_class_integer_close" type="button" class="btn btn-default CLOSE" title="Закрыть" data-cmd="CLOSE">
      <span class="glyphicon glyphicon-remove"></span>
    </button>
```

###  FORM, DIV, TR, LI (для представления объектов)

**1.** секции и узлы навигации `n_{имя секции навигации}`

```
<a id="n_simple_types" href="#" title="Простые типы">
    <i class="fa fa-menu-arrow pull-right toggler"></i>
    <i class="main-icon fa fa-institution" title="Простые типы"></i>
    <span>Простые типы</span>
  </a>
```

Узел навигации `n_{код узла навигации}`.

```
<a id="n_class_integer" class="menu-link" href="/registry/develop-and-test@class_integer" title="Класс &quot;Целое [6]">Класс "Целое [6]</a>
```
Узел навигации открытого класса.

 --------------------------------------------------------------------------  


 #### [Licence](/LICENSE)&ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [English](/docs/en/3_modules_description/registry_code.md) &ensp;
<div><img src="https://mc.iondv.com/watch/local/docs/framework" style="position:absolute; left:-9999px;" height=1 width=1 alt="iondv metrics"></div>         



--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV".**   
All rights reserved. 