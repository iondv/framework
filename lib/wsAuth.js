/**
 * Created by krasilneg on 29.07.17.
 */
const User = require('core/User');
const crypto = require('crypto');

/**
 * @param {{}} options
 * @param {Auth} options.auth
 * @param {DataSource} options.dataSource
 * @param {AclProvider} options.acl
 * @param {Number} options.tokenLifetime
 * @constructor
 */
function WsAuth(options) {
  function generateToken(uid) {
    let gen = new Promise((resolve, reject) => {
      crypto.randomBytes(256, function (err, buffer) {
        if (err) {
          return reject(err);
        }

        let token = crypto
          .createHash('sha1')
          .update(buffer)
          .digest('hex');
        resolve(token);
      });
    });
    return gen.then((t)=> {
      let exp = new Date();
      exp.setSeconds(exp.getSeconds() + (options.tokenLifetime || 60 * 60 * 24 * 365 * 100));

      return options.dataSource.upsert('ion_user_tokens',
        {uid: uid},
        {
          token: t,
          expires: exp
        })
        .then(() => t);
    });
  }

  this.generateToken = function (user, type) {
    return generateToken(user + '@' + (type || options.userType || 'local'));
  };

  this.secureTokenGeneration = function (user, pwd) {
    return options.auth.signIn(user, pwd, options.userType || 'local')
      .then((u) => {
        return generateToken(u.id + '@' + u.type);
      });
  };

  /**
   * @param {{}} credentials
   * @param {String} credentials.user
   * @param {String} [credentials.type]
   * @param {String} [credentials.pwd]
   * @param {String} [credentials.token]
   * @returns {Promise.<User>}
   */
  this.authorise = function (credentials) {
    let type = credentials.type;
    let username = credentials.user;
    if (username.indexOf('@') > 0) {
      let tmp = username.split('@');
      username = tmp[0];
      type = tmp[1];
    }
    let getter = null;
    if (credentials.token) {
      getter = options.dataSource.fetch('ion_user_tokens', {token: credentials.token, expires: {$lt: new Date()}})
        .then((t) => {
          return new Promise((resolve, reject) => {
            if (!t) {
              return resolve(null);
            }
            options.auth.userProfile(t.uid,(err, u) => {
              return err ? reject(err) : resolve(u && u.name() === username ? u : null);
            });
          });
        });
    } else if (credentials.pwd) {
      getter = options.auth.signIn(username, credentials.pwd, type);
    }
    return getter
      .then((u) => {
        if (!u) {
          return null;
        }
        return options.acl.getCoactors(u.id())
          .then((coactors)=> {
            let ca = {};
            coactors.forEach((a)=> {
              ca[a] = true;
            });
            return new User(u, ca);
          });
      });
  };
}

module.exports = WsAuth;
