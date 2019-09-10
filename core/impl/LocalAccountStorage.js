const IAccountStorage = require('core/interfaces/AccountStorage');
const User = require('core/User');
const UserTypes = require('core/UserTypes');
const F = require('core/FunctionCodes');
const pwdHasher = require('password-hash-and-salt');
const clone = require('clone');

class LocalAccountStorage extends IAccountStorage {
  /**
   * @param {{}} options
   * @param {Number} [options.passwordMinLength]
   * @param {Boolean} [options.caseInsensitiveLogin]
   * @param {DataSource} options.dataSource
   * @param {Array.<ProfilePlugin>} [options.plugins]
   */
  constructor(options) {
    super();
    this.ds = options.dataSource;
    this.passwordMinLength = options.passwordMinLength || 0;
    this.caseInsensitiveLogin = Boolean(options.caseInsensitiveLogin);
    this.plugins = options.plugins || [];
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

    if (typeof user.pwd === 'string' && user.pwd) {
      let hasher = pwdHasher(user.pwd);
      return new Promise((resolve, reject) => {
        hasher.hash((err, hash) => {
          user.pwd = hash;
          user.pwdDate = new Date();
          user.disabled = false;
          user.needPwdReset = (typeof user.needPwdReset == 'undefined') ? false : user.needPwdReset;
          this.ds.upsert('ion_user', {[F.AND]: [{[F.EQUAL]: ['$id', user.id]}, {[F.EQUAL]: ['$type', user.type]}]}, user)
            .then((u) => {
              resolve(new User(u));
            })
            .catch(reject);
        });
      });
    } else if (user.pwd && user.pwd.hash || this.passwordMinLength === 0) {
      user.pwd = user.pwd ? user.pwd.hash : null;
      user.pwdDate = new Date();
      user.disabled = false;
      user.needPwdReset = (typeof user.needPwdReset == 'undefined') ? false : user.needPwdReset;
      return this.ds.upsert('ion_user', {[F.AND]: [{[F.EQUAL]: ['$id', user.id]}, {[F.EQUAL]: ['$type', user.type]}]}, user).then(u => new User(u));
    } else if (user.type !== UserTypes.LOCAL) {
      return this.ds.upsert('ion_user', {[F.AND]: [{[F.EQUAL]: ['$id', user.id]}, {[F.EQUAL]: ['$type', user.type]}]}, user).then(u => new User(u));
    } else {
      throw new Error('Не передан пароль');
    }
  }

  _unregister(id) {
    let type = UserTypes.LOCAL;
    if (id.indexOf('@') > 0) {
      let un = id.split('@');
      id = un[0];
      type = un[1];
    }
    return this.ds.delete('ion_user', {[F.AND]: [{[F.EQUAL]: ['$id', id]}, {[F.EQUAL]: ['$type', type]}]});
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

    const writer = (resolve, reject) => {
      hasher.hash((err, hash) => {
        let pwd = hash;
        let pwdDate = new Date();
        this.ds.update(
          'ion_user',
          {
            [F.AND]: [
              {[F.EQUAL]: ['$type', type || UserTypes.LOCAL]},
              {[F.EQUAL]: ['$id', id]}
            ]
          },
          {pwd, pwdDate, needPwdReset: false}
          )
          .then(() => resolve(pwd))
          .catch(reject);
      });
    };

    return new Promise((resolve, reject) => {
      if (!oldpwd) {
        return writer(resolve, reject);
      }

      hasher.verifyAgainst(oldpwd,
        (err, verified) => {
          if (err) {
            reject(new Error('Не удалось поменять пароль!'));
          }
          if (verified) {
            reject(new Error('Новый пароль совпадает со старым!'));
          }
          writer(resolve, reject);
        });
    });
  }

  _pluginAction(cb) {
    let promises = Promise.resolve();
    let fields = {};
    Object.values(this.plugins).forEach(
      (plugin) => {
        promises = promises
          .then(() => cb(plugin))
          .then((result) => {
            fields = Object.assign(fields, result);
          });
      });
    return promises.then(() => fields);
  }

  _profileFields() {
    return this._pluginAction(plugin => plugin.fields());
  }

  _validate(data) {
    return this._pluginAction(plugin => plugin.validate(data));
  }

  /**
   * @param {String} id
   * @param {String} [pwd]
   * @param {Boolean} [disabled]
   * @returns {Promise.<{User}>}
   */
  _get(id, pwd, disabled) {
    let checker = (typeof pwd === 'string') ? pwdHasher(pwd) : null;
    let type = UserTypes.LOCAL;
    if (id.indexOf('@') > 0) {
      let un = id.split('@');
      id = un[0];
      type = un[1];
    }
    let filter = [
      {[F.EQUAL]: ['$type', type || UserTypes.LOCAL]},
      this.caseInsensitiveLogin
        ? {[F.LIKE]: ['$id', `^${id}$`]}
        : {[F.EQUAL]: ['$id', id]}
    ];
    if (!disabled) {
      filter.push(
        {
          [F.OR]: [
            {[F.EQUAL]: ['$disabled', false]},
            {[F.EMPTY]: ['$disabled']}
          ]
        }
      );
    }

    return this.ds.get('ion_user', {[F.AND]: filter})
      .then((user) => {
        if (user) {
          if ((!user.pwd && (pwd === '') && this.passwordMinLength === 0) || !checker) {
            return user;
          }
          return new Promise((resolve, reject) => {
            if (!user.pwd && pwd || user.pwd && !pwd) {
              return reject(new Error('Неверно указан пароль.'));
            }
            checker.verifyAgainst(user.pwd, (err, verified) => {
              if (verified) {
                return resolve(user);
              }
              if (!err) {
                err = new Error('Неверно указан пароль.');
              }
              reject(err);
            });
          });
        }
        return null;
      })
      .then((user) => {
        if (!user) {
          return null;
        }
        const u = new User(user);
        return this._pluginAction(plugin => plugin.properties(u.id()))
          .then((data) => {
            u.setProperties(data);
            return u;
          });
      });
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
        if (updates.hasOwnProperty(nm) && nm !== 'properties' && nm !== 'pwd') {
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

    let skipResult = (data.id && (id !== data.id)) || (data.type && data.type !== type);

    return this.ds.update(
      'ion_user',
      {
        [F.AND]: [
          {[F.EQUAL]: ['$id', id]},
          {[F.EQUAL]: ['$type', type]}
        ]
      },
      data,
      {skipResult}
      )
      .then(u => u ? u : this.ds.get('ion_user', {[F.AND]: [{[F.EQUAL]: ['$id', data.id]}, {[F.EQUAL]: ['$type', data.type]}]}))
      .then(u => new User(u));
  }


  /**
   * @param {String[]} [filter]
   * @param {Boolean} [disabled]
   * @returns {Promise.<{User[]}>}
   */
  _list(filter, disabled) {
    let f = [];
    if (Array.isArray(filter) && filter.length) {
      let conds = [];
      filter.forEach((id) => {
        let parts = id.split('@');
        conds.push({
          [F.AND]: [
            this.caseInsensitiveLogin
              ? {[F.LIKE]: ['$id', `^${parts[0]}$`]}
              : {[F.EQUAL]: ['$id', parts[0]]},
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
        let p = Promise.resolve();
        list.forEach((u) => {
          let user = new User(u);
          p = p
            .then(() => this._pluginAction(plugin => plugin.properties(user.id())))
            .then((data) => {
              user.setProperties(data);
              result.push(user);
            });
        });
        return p.then(() => result);
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
    return this.ds.update('ion_user', {[F.EQUAL]: ['$id', id]}, {disabled: true}).then(() => true);
  }

  /**
   * @param {String} id
   * @returns {Promise}
   */
  _enable(id) {
    return this.ds.update('ion_user', {[F.EQUAL]: ['$id', id]}, {disabled: false}).then(() => true);
  }
}

module.exports = LocalAccountStorage;
