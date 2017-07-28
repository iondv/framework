/**
 * Created by krasilneg on 29.07.17.
 */
const User = require('core/User');
const crypto = require('crypto');

/**
 * @param {{}} options
 * @param {Auth} options.auth
 * @param {DataSource} options.ds
 * @param {AclProvider} options.acl
 * @constructor
 */
function TokenAuth(options) {
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
      exp.setSeconds(exp.getSeconds() + (options.accessTokenLifetime || 60 * 60 * 24 * 365 * 100));

      return options.ds.upsert('ion_user_tokens',
        {uid: uid},
        {
          token: t,
          expires: exp
        })
        .then(() => t);
    });
  }

  this.generateToken = function (user, type) {
    return generateToken(user + '@' + (type || 'local'));
  };

  this.secureTokenGeneration = function (user, pwd) {
    return options.auth.signIn(user, pwd, options.userType || 'local')
      .then((u) => {
        return generateToken(u.id + '@' + u.type);
      });
  };

  this.authorise = function (token) {
    return options.ds.fetch('ion_user_tokens', {token: token, expires: {$lt: new Date()}})
      .then((t) => {
        return new Promise(function (resolve, reject) {
          options.auth.userProfile(t.uid,(err, u) => {
            return err ? reject(err) : resolve(u);
          });
        });
      })
      .then((u) => {
        let user = new User(user);
        return options.acl.getCoactors(user.id())
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

module.exports = TokenAuth;
