'use strict';

function Share(link, options) {

  this.getLink = function () {
    return link;
  };

  /**
   * @returns {{}}
   */
  this.getOptions = function () {
    return options;
  };
}

module.exports = Share;
