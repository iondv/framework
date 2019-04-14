/**
 * Created by kras on 26.07.16.
 */
'use strict';

function StoredFile (id, link, options, streamGetter) {
  this.id = id;

  this.link = link;

  this.options = options;

  this.name = this.options.name || this.id;

  /**
   * @returns {Promise}
   */
  this.getContents = function () {
    return new Promise((resolve, reject) => {
      if (typeof streamGetter === 'function') {
        try {
          streamGetter((err, stream) => {
            if (err) {
              return reject(err);
            }
            if (!stream) {
              return reject(new Error('Не удалось получить поток чтения файла.'));
            }
            return resolve({
              name: this.name,
              options: this.options,
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

  /**
   * @returns {StoredFile}
   */
  this.clone = function () {
    return new StoredFile(this.id, this.link, this.options, streamGetter);
  };
}

module.exports = StoredFile;
