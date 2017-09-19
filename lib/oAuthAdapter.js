/**
 * Created by Данил on 13.04.2017.
 */

const OAuth2Server = require('oauth2-server');
const OAuthRequest = OAuth2Server.Request;
const OAuthResponse = OAuth2Server.Response;
const UnauthorizedRequestError = require('oauth2-server/lib/errors/unauthorized-request-error');

const User = require('core/User');
const UserTypes = require('core/UserTypes');

/**
 * @param {{auth: Auth}} options
 * @constructor
 */
function OAuth2Adapter(options) {
  var server = OAuth2Server({
    accessTokenLifetime: options.accessTokenLifetime ? options.accessTokenLifetime : 3600,
    model: {

      /**
       * Get access token.
       */
      getAccessToken: function (bearerToken) {
        return options.dataSource
          .fetch('ion_oauth2_token',
            {
              filter: {
                accessToken: bearerToken,
                expires: {$gte: new Date()}
              }
            }
          )
          .then((results) => results.length > 0 ? results[0] : null)
          .then((token) => {
            if (token) {
              return new Promise((resolve, reject) => {
                options.auth.userProfile(token.userId, (profile) => {
                  token.user = profile;
                  resolve(token);
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
        return options.auth.signIn(clientId, clientSecret, UserTypes.SYSTEM)
          .then((u) => {
            let oauthOpts = u.properties() && u.properties().oauth || {};
            return {
              id: u.name(),
              grants: oauthOpts.grants,
              accessTokenLifetime: oauthOpts.accessTokenLifetime,
              refreshTokenLifetime: oauthOpts.refreshTokenLifetime
            };
          });
      },

      /**
       * Get refresh token.
       */
      getRefreshToken: function (refreshToken) {
        return options.dataSource
          .fetch('ion_oauth2_token',
            {
              filter: {
                refreshToken: refreshToken,
              }
            }
          )
          .then((results) => results.length > 0 ? results[0] : null)
          .then((token) => {
            if (token) {
              return new Promise((resolve, reject) => {
                options.auth.userProfile(token.userId, (profile) => {
                  token.user = profile;
                  resolve(token);
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
          accessTokenExpiresOn: token.accessTokenExpiresOn,
          clientId: client.clientId,
          refreshToken: token.refreshToken,
          refreshTokenExpiresOn: token.refreshTokenExpiresOn,
          userId: user.id(),
        };

        return options.dataSource.insert('ion_oauth2_token', accessToken).then(() => {
          accessToken.client = client;
          accessToken.user = user;
          return accessToken;
        });
      }
    }
  });

  this.token = function (options) {
    return function (req, res, next) {
      let request = new OAuthRequest(req);
      let response = new OAuthResponse(res);

      server.token(request, response, options)
        .then(() => {handleResponse(req, res, response);})
        .catch((e) => {handleError(e, req, res, response, next);});
    };
  };

  this.authenticate = function (headers, options) {
    let request = new OAuthRequest({headers});
    let response = new OAuthResponse({});
    return server.authenticate(request, response, options)
      .then((token) => {
        return new User(token.user);
      })
      .catch((e) => {
        if (e instanceof UnauthorizedRequestError) {
          return Promise.resolve();
        }
        return Promise.reject(e);
      });
  };

  this.grant = function (module, options) {
    return function (req, res, next) {
      if (req.method === 'GET') {
        res.status(200).render('oauth-grant', {
          module: module,
          claimApp: '',
        });
      } else if (req.method === 'POST') {
        let request = new OAuthRequest(req);
        let response = new OAuthResponse(res);
        server.authorize(request, response, options)
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

function handleError(e, req, res, response, next) {
    if (response) {
      res.set(response.headers);
    }
    res.status(e.code);
    res.send({ error: e.name, error_description: e.message });
}

module.exports = OAuth2Adapter;
