/**
 * Created by Данил on 02.08.2016.
 */

'use strict';

/**
 * @param {DataPart} src
 * @constructor
 */
function DataPart(src) {
  this.mimeType = src.getMimeType();
  this.contents = src.getContents();
}

module.export = DataPart;
