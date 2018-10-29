const IAccountStorage = require('core/interfaces/AccountStorage');
const User = require('core/User');
const UserTypes = require('core/UserTypes');
const F = require('core/FunctionCodes');
const pwdHasher = require('password-hash-and-salt');
const clone = require('clone');

class LocalAccountStorage extends IAccountStorage {
  /**
   * @param {{}} options
   * @param {DataSource} options.dataSource
   * @param {Number} [options.passwordMinLength]
   * @param {Boolean} [options.loginCaseInsesitive]
   */
  constructor(options) {
    super();
    this.ds = options.dataSource;
    this.passwordMinLength = options.passwordMinLength;
    this.loginCaseInsesitive = Boolean(options.loginCaseInsesitive);
  }

  init() {
    return this.ds.ensureIndex('ion_user', {type: 1, id: 1}, {unique: true});
  }

  _prepareId(id) {
    return id && this.loginCaseInsesitive ? String(id).toUpperCase() : id;
  }

  /**
   * @param {{}} data
   * @returns {Promise.<User>}
   */
  _register(data) {
    let user = clone(data);
    user.type = user.type || UserTypes.LOCAL;

    if (!user.name) {
      user.name = user.email;
    }

    if (!user.id) {
      user.id = user.name;
    }

    user.id = this._prepareId(user.id);

    if (typeof user.pwd === 'string') {
      let hasher = pwdHasher(user.pwd);
      return new Promise((resolve, reject) => {
        hasher.hash((err, hash) => {
          user.pwd = hash;
          user.pwdDate = new Date();
          user.disabled = false;
          this.ds.insert('ion_user', user)
            .then((u) => {
              resolve(u);
            })
            .catch(reject);
        });
      });
    } else if (user.pwd && user.pwd.hash) {
      user.pwd = user.pwd.hash;
      user.pwdDate = new Date();
      user.disabled = false;
      return this.ds.insert('ion_user', user);
    } else if (user.type !== UserTypes.LOCAL) {
      return this.ds.insert('ion_user', user).then(u => new User(u));
    } else {
      throw new Error('Не передан пароль');
    }
  }

  /**
   * @param {String} id
   * @param {String} oldpwd
   * @param {String} pwd
   * @returns {Promise}
   */
  _setPassword(id, oldpwd, pwd) {
    let hasher = pwdHasher(pwd);
    let type = UserTypes.LOCAL;
    if (id.indexOf('@') > 0) {
      let un = id.split('@');
      id = un[0];
      type = un[1];
    }
    return new Promise((resolve, reject) => {
      hasher.verifyAgainst(oldpwd,
        (err, verified) => {
          if (err) {
            reject(new Error('Не удалось поменять пароль!'));
          }
          if (verified) {
            reject(new Error('Новый пароль совпадает со старым!'));
          }
          hasher.hash((err, hash) => {
            let pwd = hash;
            let pwdDate = new Date();
            this.ds.update(
                'ion_user',
                {[F.AND]: [
                  {[F.EQUAL]: ['$type', type || UserTypes.LOCAL]},
                  {[F.EQUAL]: ['$id', this._prepareId(id)]}
                ]},
                {pwd, pwdDate}
              )
              .then(() => resolve(true))
              .catch(reject);
          });
        });
    });
  }

  /**
   * @param {String} id
   * @param {String} [pwd]
   * @returns {Promise.<User>}
   */
  _get(id, pwd) {
    let checker = pwd ? pwdHasher(pwd) : null;
    let type = UserTypes.LOCAL;
    if (id.indexOf('@') > 0) {
      let un = id.split('@');
      id = un[0];
      type = un[1];
    }
    return this.ds.get('ion_user',
      {
        [F.AND]: [
          {[F.EQUAL]: ['$type', type || UserTypes.LOCAL]},
          {[F.EQUAL]: ['$id', this._prepareId(id)]},
          {
            [F.OR]: [
              {[F.EQUAL]: ['$disabled', false]},
              {[F.EMPTY]: ['$disabled']}
            ]
          }
        ]
      })
      .then((user) => {
        if (user) {
          if (!user.pwd || !pwd) {
            return user;
          }
          if (!checker) {
            return user;
          }
          return new Promise((resolve, reject) => {
            checker.verifyAgainst(user.pwd, (err, verified) => {
              if (verified) {
                return resolve(user);
              }
              if (!err) {
                err = new Error('Неверно указан пароль.');
              }
              return reject(err);
            });
          });
        }
        return null;
      })
      .then(user => user ? new User(user) : null);
  }

  /**
   * @param {String} id
   * @param {{}} updates
   * @returns {*|Promise.<User>}
   */
  _set(id, updates) {
    let type = UserTypes.LOCAL;
    if (id.indexOf('@') > 0) {
      let un = id.split('@');
      id = un[0];
      type = un[1];
    }

    let data = {};
    if (updates) {
      for (let nm in updates) {
        if (updates.hasOwnProperty(nm) && nm !== 'properties') {
          data[nm] = updates[nm];
        }
      }
      if (updates.properties) {
        for (let nm in updates.properties) {
          if (updates.properties.hasOwnProperty(nm)) {
            data['properties.' + nm] = updates.properties[nm];
          }
        }
      }
    }
    return this.ds.update(
      'ion_user',
      {
        [F.AND]: [
          {[F.EQUAL]: ['$id', this._prepareId(id)]},
          {[F.EQUAL]: ['$type', type]}
        ]
      },
      data
    ).then(u => new User(u));
  }

  /**
   * @param {String[]} [filter]
   * @param {Boolean} [disabled]
   * @returns {Promise.<User[]>}
   */
  _list(filter, disabled) {
    let f = [];
    if (Array.isArray(filter) && filter.length) {
      let conds = [];
      filter.forEach((id) => {
        let parts = id.split('@');
        conds.push({
          [F.AND]: [
            {[F.EQUAL]: ['$id', this._prepareId(parts[0])]},
            {[F.EQUAL]: ['$type', parts[1]]}
          ]
        });
      });
      if (conds.length > 1) {
        f.push({[F.OR]: conds});
      } else {
        f.push(conds[0]);
      }
    }
    if (!disabled) {
      f.push({
        [F.OR]: [
          {[F.EQUAL]: ['$disabled', false]},
          {[F.EMPTY]: ['$disabled']}
        ]
      });
    }
    return this.ds
      .fetch('ion_user', {filter: f.length ? {[F.AND]: f} : null})
      .then((list) => {
        let result = [];
        list.forEach((u) => {
          result.push(new User(u));
        });
        return result;
      });
  }

  /**
   * @param {String} sv
   * @returns {Promise.<User[]>}
   */
  _search(sv) {
    return this.ds
      .fetch('ion_user',
        {
          filter: {
            [F.AND]: [
              {[F.LIKE]: ['$id', '^' + this._prepareId(sv) + '\\w*']},
              {[F.EQUAL]: ['$type', UserTypes.LOCAL]}
            ]
          },
          count: 10
        })
      .then((list) => {
        let result = [];
        list.forEach((u) => {
          result.push(new User(u));
        });
        return result;
      });
  }

  /**
   * @param {String} id
   * @returns {Promise}
   */
  _disable(id) {
    return this.ds
      .update('ion_user', {[F.EQUAL]: ['$id', this._prepareId(id)]}, {disabled: true})
      .then(() => true);
  }

  /**
   * @param {String} id
   * @returns {Promise}
   */
  _enable(id) {
    return this.ds
      .update('ion_user', {[F.EQUAL]: ['$id', this._prepareId(id)]}, {disabled: false})
      .then(() => true);
  }
}

module.exports = LocalAccountStorage;
