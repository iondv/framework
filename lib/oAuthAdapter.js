/**
 * Created by Данил on 13.04.2017.
 */

const OAuth2Server = require('oauth2-server');
const OAuthRequest = OAuth2Server.Request;
const OAuthResponse = OAuth2Server.Response;
const UnauthorizedRequestError = require('oauth2-server/lib/errors/unauthorized-request-error');

const User = require('core/User');
const UserTypes = require('core/UserTypes');
const F = require('core/FunctionCodes');

/**
 * @param {{auth: Auth, dataSource: DataSource}} options
 * @constructor
 */
function OAuth2Adapter(options) {

  function userToClient(u) {
    const oauthOpts = u.properties() && u.properties().oauth ||
      {
        grants: ['authorization_code'],
        redirectUris: ['http://redirect.location/handler']
      };
    return {
      id: u.id(),
      grants: oauthOpts.grants,
      redirectUris: oauthOpts.redirectUris,
      accessTokenLifetime: oauthOpts.accessTokenLifetime,
      refreshTokenLifetime: oauthOpts.refreshTokenLifetime
    };
  }

  var server = new OAuth2Server({
    accessTokenLifetime: options.accessTokenLifetime ? options.accessTokenLifetime : 3600,
    model: {

      /**
       * Get access token.
       */
      getAccessToken: function (bearerToken) {
        return options.dataSource
          .fetch(
            'ion_oauth2_token',
            {
              filter: {
                [F.AND]: [
                  {[F.EQUAL]: ['$accessToken', bearerToken]},
                  {[F.GREATER_OR_EQUAL]: ['$accessTokenExpiresAt', new Date()]}
                ]
              }
            }
          )
          .then((results) => {
            let token = results.length > 0 ? results[0] : null;
            if (token) {
              return new Promise((resolve, reject) => {
                options.auth.userProfile(token.userId, (profile) => {
                  if (!profile) {
                    return reject(new Error(`User ${token.userId} not found`));
                  }
                  token.user = profile;
                  options.auth.userProfile(token.clientId, (profile) => {
                    if (!profile) {
                      return reject(new Error(`Client ${token.clientId} not found`));
                    }
                    token.client = userToClient(profile);
                    resolve(token);
                  });
                });
              });
            }
            return null;
          });
      },

      /**
       * Get client.
       */
      getClient: function (clientId, clientSecret) {
        if (!clientSecret) {
          return new Promise((resolve, reject) => {
            options.auth.userProfile(clientId, (u) => {
              if (!u) {
                return reject(new Error(`Client ${clientId} not found.`));
              }
              resolve(userToClient(u));
            });
          });
        }

        return options.auth
          .signIn(clientId, clientSecret, UserTypes.SYSTEM)
          .then(u => userToClient(u));
      },

      /**
       * Get refresh token.
       */
      getRefreshToken: function (refreshToken) {
        return options.dataSource
          .fetch('ion_oauth2_token',
            {
              filter: {
                [F.AND]: [
                  {[F.EQUAL]: ['$refreshToken', refreshToken]},
                  {[F.GREATER_OR_EQUAL]: ['$refreshTokenExpiresAt', new Date()]}
                ]
              }
            }
          )
          .then(results => results.length > 0 ? results[0] : null)
          .then((token) => {
            if (token) {
              return new Promise((resolve, reject) => {
                options.auth.userProfile(token.userId, (profile) => {
                  if (!profile) {
                    return reject(new Error(`User ${token.userId} not found`));
                  }
                  token.user = profile;
                  options.auth.userProfile(token.clientId, (profile) => {
                    if (!profile) {
                      return reject(new Error(`Client ${token.clientId} not found`));
                    }
                    token.client = userToClient(profile);
                    resolve(token);
                  });
                });
              });
            }
            return null;
          });
      },

      /**
       * Get user.
       */
      getUser: function (username, password) {
        return options.auth.signIn(username, password, UserTypes.LOCAL);
      },

      /**
       * Save token.
       */
      saveToken: function (token, client, user) {
        let accessToken = {
          accessToken: token.accessToken,
          accessTokenExpiresAt: token.accessTokenExpiresAt,
          clientId: client.id,
          refreshToken: token.refreshToken,
          refreshTokenExpiresAt: token.refreshTokenExpiresAt,
          userId: user.id()
        };

        return options.dataSource
          .delete('ion_oauth2_token', {[F.LESS]: ['$accessTokenExpiresAt', new Date()]})
          .then(() => options.dataSource.insert('ion_oauth2_token', accessToken))
          .then(() => {
            token.client = client;
            token.user = user;
            return token;
          });
      },

      saveAuthorizationCode: function (code, client, user) {
        const authCode = {
          code: code.authorizationCode,
          expiresAt: code.expiresAt,
          clientId: client.id,
          userId: user.id()
        };
        return options.dataSource
          .delete('ion_oauth2_authcode', {[F.LESS]: ['$expiresAt', new Date()]})
          .then(() => options.dataSource.insert('ion_oauth2_authcode', authCode))
          .then(() => code);
      },

      revokeAuthorizationCode: function (code) {
        return options.dataSource
          .delete('ion_oauth2_authcode', {[F.EQUAL]: ['$code', code.code]})
          .then(count => count > 0);
      },

      getAuthorizationCode: function (authorizationCode) {
        return options.dataSource
          .fetch('ion_oauth2_authcode',
            {
              filter: {
                [F.AND]: [
                  {[F.EQUAL]: ['$code', authorizationCode]},
                  {[F.GREATER_OR_EQUAL]: ['$expiresAt', new Date()]}
                ]
              }
            }
          )
          .then(results => results.length > 0 ? results[0] : null)
          .then((code) => {
            if (code) {
              return new Promise((resolve, reject) => {
                options.auth.userProfile(code.userId, (profile) => {
                  if (!profile) {
                    return reject(new Error(`User ${code.userId} not found.`));
                  }
                  code.user = profile;
                  options.auth.userProfile(code.clientId, (profile) => {
                    if (!profile) {
                      return reject(new Error(`Client ${code.clientId} not found.`));
                    }
                    code.client = userToClient(profile);
                    resolve(code);
                  });
                });
              });
            }
            return null;
          });

      }
    }
  });

  this.token = function () {
    return function (req, res, next) {
      let request = new OAuthRequest(req);
      let response = new OAuthResponse(res);

      server.token(request, response, options.settings || {})
        .then(() => {handleResponse(req, res, response);})
        .catch((e) => {handleError(e, req, res, response, next);});
    };
  };

  this.authenticate = function (req) {
    let request = new OAuthRequest(req);
    let response = new OAuthResponse({});
    return server.authenticate(request, response, options.settings || {})
      .then(token => new User(token.user))
      .catch((e) => {
        if (e instanceof UnauthorizedRequestError) {
          return;
        }
        throw e;
      });
  };

  this.grant = function (module) {
    return function (req, res, next) {
      if (req.method === 'GET') {
        if (!req.query.client_id) {
          res.status(401).send('Client application credentials were not specified.');
        }
        options.auth.userProfile(req.query.client_id, (u) => {
          if (!u) {
            res.status(404).send('Client not found.');
            return;
          }
          res.status(200).render('oauth-grant', {
            module: module,
            claimApp: u.name()
          });
        });
      } else if (req.method === 'POST') {
        let request = new OAuthRequest(req);
        let response = new OAuthResponse(res);
        const opts = options.settings || {};
        opts.authenticateHandler = {handle: () => options.auth.getUser(req)};
        server.authorize(request, response, opts)
          .then(() => {
            handleResponse(req, res, response);
          })
          .catch((err) => {
            handleError(err, req, res, response, next);
          });
      }
    };
  };
}

/**
 * Handle response.
 */
function handleResponse(req, res, response) {
  if (response.status === 302) {
    let location = response.headers.location;
    delete response.headers.location;
    res.set(response.headers);
    res.redirect(location);
  } else {
    res.set(response.headers);
    res.status(response.status).send(response.body);
  }
}

/**
 * Handle error.
 */

function handleError(e, req, res, response) {
  if (response) {
    res.set(response.headers);
  }
  res.status(400);
  res.send({code: e.code, error: e.name, error_description: e.getMessage(req.locals.lang)});
}

module.exports = OAuth2Adapter;
