/**
 * Created by kalias_90 on 06.09.16.
 */
'use strict';

var StoredFile = require('core/interfaces/ResourceStorage').StoredFile;

function StoredImage(id, link, options, streamGetter, thumbnails) {
  var _this = this;

  _this.thumbnails = [];

  _this.prototype = new StoredFile(id, link, options, streamGetter);
}

module.exports = StoredImage;
