'use strict';

$(function () {
  $.ajax({
    url: 'api/i18n',
    type: 'GET',
    success: function (data) {
      window.i18n.base = data;
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.error(errorThrown);
    }
  });
});

function I18nHandler() {
  this.base = {};
  this.s = function(prefix, id, params) {
    if (prefix && id) {
      if (this.base.hasOwnProperty(prefix) && this.base[prefix].hasOwnProperty(id)) {
        var str = this.base[prefix][id];
        if (params) {
          for (var p in params) {
            str = str.replace('%' + p, params[p]);
          }
        }
        return str;
      }
      return id;
    }
    return '';
  };
}

window.i18n = new I18nHandler();
window.s = window.i18n.s.bind(window.i18n);
