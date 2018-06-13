class AccountStorage {
  /**
   * @param {{}} data
   * @returns {Promise.<{User}>}
   */
  register(data) {
    return this._register(data);
  }

  /**
   * @param {String} id
   * @param {String} oldPwd
   * @param {String} newPwd
   * @returns {Promise}
   */
  setPassword(id, oldPwd, newPwd) {
    return this._setPassword(id, oldPwd, newPwd);
  }

  /**
   * @param {String} id
   * @param {String} [pwd]
   * @returns {Promise.<{User}>}
   */
  get(id, pwd) {
    return this._get(id, pwd);
  }

  /**
   * @param {String} id
   * @param {{}} updates
   * @returns {*|Promise}
   */
  set(id, updates) {
    return this._set(id, updates);
  }

  /**
   * @param {String[]} [filter]
   * @param {Boolean} [disabled]
   * @returns {Promise.<{User[]}>}
   */
  list(filter, disabled) {
    return this._list(filter, disabled);
  }

  /**
   * @param {String} sv
   * @returns {Promise.<{User[]}>}
   */
  search(sv) {
    return this._search(sv);
  }

  /**
   * @param {String} id
   * @returns {Promise}
   */
  disable(id) {
    return this._disable(id);
  }

  /**
   * @param {String} id
   * @returns {Promise}
   */
  enable(id) {
    return this._enable(id);
  }
}

module.exports = AccountStorage;