/**
 * Created by kalias_90 on 06.09.16.
 */
'use strict';

var StoredFile = require('core/interfaces/ResourceStorage').StoredFile;

/**
 * @param {StoredFile} sf
 * @constructor
 */
function StoredImage(sf, thumbnails) {
  var _this = this;

  _this.thumbnails = thumbnails;
  _this.id = sf.id;
  _this.link = sf.link;
  _this.options = sf.options;
  _this.name = sf.name;

  _this.protptype = sf;

}

module.exports = StoredImage;
