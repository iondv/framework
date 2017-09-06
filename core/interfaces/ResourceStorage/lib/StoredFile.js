/**
 * Created by kras on 26.07.16.
 */
'use strict';

function StoredFile(id, link, options, streamGetter) {
  var _this = this;

  this.id = id;

  this.link = link;

  this.options = options;

  this.name = this.options.name || this.id;

  /**
   * @returns {Promise}
   */
  this.getContents = function () {
    return new Promise(function (resolve, reject) {
      if (typeof streamGetter === 'function') {
        try {
          streamGetter((err, stream) => {
            if (err) {
              return reject(err);
            }
            return resolve({
              name: _this.name,
              options: _this.options,
              stream: stream
            });
          });
        } catch (err) {
          reject(err);
        }
      } else {
        reject(new Error('Не указана функция получения потока ввода для файла.'));
      }
    });
  };
}

module.exports = StoredFile;
