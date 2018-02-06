const IAccountStorage = require('core/interfaces/AccountStorage');
const User = require('core/User');
const UserTypes = require('core/UserTypes');
const pwdHasher = require('password-hash-and-salt');
const clone = require('clone');

class LocalAccountStorage extends IAccountStorage {
  /**
   * @param {{}} options
   * @param {DataSource} options.dataSource
   */
  construct(options) {
    this.ds = options.dataSource;
  }

  init() {
    return this.ds.ensureIndex('ion_user', {type: 1, id: 1}, {unique: true});
  }

  /**
   * @param {{}} data
   * @returns {Promise.<{User}>}
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

    if (user.pwd) {
      var hasher = pwdHasher(user.pwd);
      hasher.hash(function (err, hash) {
        user.pwd = hash;
        user.pwdDate = new Date();
        user.disabled = false;
        ds.insert('ion_user', user)
          .then(function (u) {
            callback(null, u);
          })
          .catch(function (err) {
            callback(err, null);
          });
      });
    } else if (user.type !== UserTypes.LOCAL) {
      ds.insert('ion_user', user)
        .then((u) => callback(null, new User(u)))
        .catch((err) => callback(err, null));
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
            this.ds.update('ion_user', {[F.EQUAL]: ['$id', id]}, {pwd, pwdDate})
              .then(() => resolve(true))
              .catch(reject);
          });
        });
    });
  }

  /**
   * @param {String} id
   * @param {String} [pwd]
   * @returns {Promise.<{User}>}
   */
  _get(id, pwd) {
    let checker = pwd ? pwdHasher(pwd) : null;
    let type = UserTypes.LOCAL;
    if (id.indexOf('@') > 0) {
      let un = id.split('@');
      id = un[0];
      type = un[1];
    }
    return ds.get('ion_user',
      {
        [F.AND]: [
          {[F.EQUAL]: ['$type', type || UserTypes.LOCAL]},
          {[F.EQUAL]: ['$id', username]},
          {
            [F.OR]: [
              {[F.EQUAL]: ['$disabled', false]},
              {[F.EMPTY]: ['$disabled']}
            ]
          }
        ]
      })
      .then(user => {
          if (user) {
            if (!user.pwd || !pwd) {
              if (!user.pwd && passwordMinLength && pwd) {
                throw new Error('Учетная запись не защищена паролем.');
              }
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
          throw new Error('Пользователь не зарегистрирован.');
        }
      )
      .then((user) => new User(user));
  }

  /**
   * @param {String} id
   * @param {{}} updates
   * @returns {*|Promise.<{User}>}
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
    return ds.update(
      'ion_user',
      {
        [F.AND]: [
          {[F.EQUAL]: ['$id', id]},
          {[F.EQUAL]: ['$type', type]}
        ]
      },
      data
    ).then(u => new User(u));
  }


  /**
   * @param {String[]} [filter]
   * @param {Boolean} [disabled]
   * @returns {Promise.<{User[]}>}
   */
  _list(filter, disabled) {
    let f = [];
    if (Array.isArray(filter) && filter.length) {
      f.push({[F.IN]: ['$id', filter]});
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
      .fetch('ion_user',
        {
          filter: f.length ? {[F.AND]: f} : null
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
   * @param {String} sv
   * @returns {Promise.<{User[]}>}
   */
  _search(sv) {
    return this.ds
      .fetch('ion_user',
        {
          filter: {
            [F.AND]: [
              {[F.LIKE]: ['$id', '^' + sv + '\\w*']},
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
    return this.ds.update('ion_user', {[F.EQUAL]: ['$id', id]}, {disabled: true}).then(()=>true);
  }

  /**
   * @param {String} id
   * @returns {Promise}
   */
  _enable(id) {
    return this.ds.update('ion_user', {[F.EQUAL]: ['$id', id]}, {disabled: false}).then(()=>true);
  }
}

module.exports = LocalAccountStorage;