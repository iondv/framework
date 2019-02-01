#### [Content](/docs/en/index.md)

### Back: [The registry module](/docs/en/3_modules_description/registry.md)

# The logic of forming the id elements associated with objects by type

## Implemented features

### INPUT, SELECT, TEXTAREA

**1.** To edit an attribute of an object `a_{namespace, class, attribute}`

```
<input type="text" class="form-control" id="a_develop-and-test_class_integer_integer_integer" name="integer_integer" pattern="[0-9]+([\.|,][0-9]+)?" value="5120">
```

### BUTTON

**1.** list action `la_{namespace, class, command name}`

```
<button id="la_develop-and-test_class_integer_edit" class="edit btn btn-info command" title="Edit" data-id="EDIT" style="display: inline-block;">Change</button>
```

**2.** form action `fa_{namespace, class, command name}`

```
<button id="fa_develop-and-test_class_integer_saveandclose" data-id="SAVEANDCLOSE" type="button" class="btn command object-control SAVEANDCLOSE" style="">
        Save and Close
      </button>
```

**3.** reference field action `ra_{namespace, class, attribute, command name}`

```
<button id="ra_develop-and-test_ref_use_ref_use_create" type="button" class="create-btn btn btn-success" data-ref-property="ref_use" title="Создать">
                    <span class="glyphicon glyphicon-plus-sign"></span>
                </button>
```

**4.** collection field action `ca_{namespace, class, attribute, command name}` *no opportunity to check collections in progress*

**5.** floating form buttons `ffa_{namespace, class, attribute, command name}`

```
<button id="ffa_develop-and-test_class_integer_close" type="button" class="btn btn-default CLOSE" title="Close" data-cmd="CLOSE">
      <span class="glyphicon glyphicon-remove"></span>
    </button>
```

###  FORM, DIV, TR, LI (for the objects view)

**1.** navigation sections and nodes `n_{navigation section name}`

```
<a id="n_simple_types" href="#" title="Simple types">
    <i class="fa fa-menu-arrow pull-right toggler"></i>
    <i class="main-icon fa fa-institution" title="Simple types"></i>
    <span>Simple types</span>
  </a>
```

Navogaion node `n_{navigation node code}`.

```
<a id="n_class_integer" class="menu-link" href="/registry/develop-and-test@class_integer" title="Class &quot;Integer [6]">Class "Integer [6]</a>
```
Navigation node of the open class.

 --------------------------------------------------------------------------  


 #### [Licence](/LICENCE.md)&ensp;  [Contact us](https://iondv.ru/index.html) &ensp;  [Russian](/docs/ru/3_modules_description/registry_code.md) &ensp; [FAQs](/faqs.md)          



--------------------------------------------------------------------------  

Copyright (c) 2018 LLC "ION DV".
All rights reserved.