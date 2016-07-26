/**
 * Created by kras on 26.07.16.
 */
'use strict';

function StoredFile(id, link, options, streamGetter) {
  this.id = id;

  this.link = link;

  this.options = options;

  this.name = this.options.name || this.id;

  /**
   * @returns {Promise}
   */
  this.getContents = function () {
    return new Promise(function (resolve, reject) {
      var stream = null;
      if (typeof streamGetter === 'function') {
        try {
          stream = streamGetter();
        } catch (err) {
          reject(err);
        }
      }
      resolve(stream);
    });
  };
}

module.exports = StoredFile;
