// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
const Strategy = require('passport-strategy');
const util = require('util');
const moment = require('moment');
const uuidv4 = require('uuid/v4');
const forge = require('node-forge');
const fs = require('fs');
const querystring = require('querystring');
const request = require('request');
const url = require('url');
const {join} = require('path');
const resolvePath = require('core/resolvePath');
const jwt = require('jsonwebtoken');

/**
 * @param {String} pth
 * @param {{}} params
 * @return {Promise}
 */
function readFilePromise(pth, params) {
  return new Promise((resolve, reject) => {
    fs.readFile(pth, params, (err, file) => {
      if (err) {
        return reject(err);
      }
      return resolve(file);
    });
  });
}

/**
 * @param {{}} options
 * @return {Promise}
 */
function requester(options) {
  return new Promise((resolve, reject) => {
    request(options, (err, req, body) => {
      if (err) {
        return reject(err);
      }
      try {
        const result = JSON.parse(body);
        resolve(result);
      } catch (err) {
        reject(new Error('Ошибка запроса к ЕСИА'));
      }
    });
  });
}

/**
 * @param {String} message
 * @param {String} cer
 * @param {String} key
 * @return {Promise}
 */
function pkcsEncrypt(message, cer, key) {
  let certOrCertPem;
  return readFilePromise(cer, 'utf-8')
    .then((certData) => {
      certOrCertPem = certData;
      return readFilePromise(key, 'utf-8');
    })
    .then((keyAssociatedWithCert) => {
      const p7 = forge.pkcs7.createSignedData();
      p7.content = forge.util.createBuffer(message, 'utf8');
      p7.addCertificate(certOrCertPem);
      p7.addSigner({
        key: keyAssociatedWithCert,
        certificate: certOrCertPem,
        digestAlgorithm: forge.pki.oids.sha256,
        authenticatedAttributes: [
          {type: forge.pki.oids.contentType, value: forge.pki.oids.data},
          {type: forge.pki.oids.messageDigest},
          {type: forge.pki.oids.signingTime, value: new Date()}
        ]
      });
      p7.sign();
      const pem = forge.pkcs7.messageToPem(p7);
      const secret = pem.split('\r\n').slice(1, -2).join('');
      return secret;
    });
}

/**
 * @param {{}} req
 * @return {String}
 */
function currentUrl(req) {
  return url.format({
    protocol: req.protocol,
    host: req.get('host')
  });
}

/**
 * @param {String} str
 * @return {String}
 */
function urlSafe(str) {
  return str.trim().split('+')
    .join('-')
    .split('/')
    .join('_')
    .replace('=', '');
}

const scopeTypes = {
  person: ['fullname', 'birthdate', 'gender', 'snils', 'inn'],
  contacts: ['email', 'mobile']
};

/**
 * @param {String} portalUrl
 * @param {{}} params
 * @param {String} oid
 * @param {String} token
 * @return {Promise}
 */
function requestPersonInfo(portalUrl, params, oid, token) {
  const reqParams = {
    uri: url.resolve(portalUrl, join('rs/prns', String(oid))),
    auth: {bearer: token}
  };
  return requester(reqParams)
    .then((res) => {
      const result = {};
      if (res && Array.isArray(params)) {
        params.forEach((p) => {
          if (p === 'fullname') {
            if (res.firstName) {
              result.firstName = res.firstName;
            }
            if (res.lastName) {
              result.lastName = res.lastName;
            }
            result.fullname = (result.firstName ? `${result.firstName} ` : '') + (result.lastName || '');
          } else if (p === 'birthdate' && res.birthDate) {
            result.birthDate = res.birthDate;
          } else if (res[p]) {
            result[p] = res[p];
          }
        });
      }
      return result;
    });
}

/**
 * @param {{}} element
 * @return {String | null}
 */
function getElementType(element) {
  if (element && element.type) {
    switch (element.type) {
      case 'EML': return 'email';
      case 'MBT': return 'mobile';
      default: return null;
    }
  }
  return null;
}

/**
 * @param {String} portalUrl
 * @param {{}} params
 * @param {String} oid
 * @param {String} token
 * @return {Promise}
 */
function requestContactsInfo(portalUrl, params, oid, token) {
  const reqParams = {
    uri: url.resolve(portalUrl, `rs/prns/${oid}/ctts`),
    auth: {bearer: token}
  };
  return requester(reqParams)
    .then((res) => {
      const promises = [];
      if (res && Array.isArray(res.elements) && Array.isArray(params)) {
        res.elements.forEach((uri) => {
          return promises.push(requester({
            uri, auth: {bearer: token}
          }));
        });
      }
      return Promise.all(promises);
    })
    .then((elements) => {
      const result = {};
      if (Array.isArray(params)) {
        elements.forEach((el) => {
          const elementType = getElementType(el);
          if (elementType && el.value && params.indexOf(elementType) > -1) {
            result[elementType] = el.value;
          }
        });
      }
      return result;
    });
}

/**
 * @param {String} scopeType
 * @param {{}} params
 * @param {String} portalUrl
 * @param {String} oid
 * @param {String} token
 * @return {Promise}
 */
function scopeGetter(scopeType, params, portalUrl, oid, token) {
  switch (scopeType) {
    case 'person': return requestPersonInfo(portalUrl, params, oid, token);
    case 'contacts': return requestContactsInfo(portalUrl, params, oid, token);
    default: return Promise.resolve({});
  }
}

/**
 * @param {String} portalUrl
 * @param {String} oid
 * @param {{}} scope
 * @param {String} token
 * @return {Promise}
 */
function scopeDataRequester(portalUrl, oid, scope, token) {
  const scopeKeys = scope.split(' ');
  const requestMap = {};
  let result = {};
  let promises = Promise.resolve();

  scopeKeys.forEach((sk) => {
    for (const type in scopeTypes) {
      if (scopeTypes[type].indexOf(sk) > -1) {
        if (!requestMap[type]) {
          requestMap[type] = [sk];
        } else {
          requestMap[type].push(sk);
        }
      }
    }
  });

  Object.keys(requestMap).forEach((type) => {
    promises = promises
      .then(() => {return scopeGetter(type, requestMap[type], portalUrl, String(oid), token);})
      .then((r) => {
        result = Object.assign(result, r);
      });
  });

  return promises.then(() => {return result;});
}

function EsiaStrategy(options, verify) {
  // jshint maxcomplexity:false
  options = options || {};
  Strategy.call(this, options, verify);
  if (!options.cer || !options.key || !options.mnemonik || !options.verify) {
    throw new Error('не указаны обязательные параметры подключения к ЕСИА');
  }
  this.name = 'esia';
  this.mnemonik = options.mnemonik;
  this.cer = resolvePath(options.cer);
  this.key = resolvePath(options.key);
  this.tokenPk = resolvePath(options.verify);
  this.password = options.password;
  this.scope = options.scope || 'fullname birthdate gender snils inn email';
  this.redirectUrl = options.redirectUrl || '/auth/esia/callback';
  this.redirectLogoutUrl = options.redirectLogoutUrl;
  this.portalUrl = options.portalUrl || 'https://esia-portal1.test.gosuslugi.ru/';
  this.tokenUrl = options.tokenUrl || 'aas/oauth2/te';
  this.codeUrl = options.codeUrl || 'aas/oauth2/ac';
  this._verify = verify;
  this._encrypt = function (msg) {
    return pkcsEncrypt(msg, this.cer, this.key);
  };

  if (options.auth) {
    options.auth.on('logout', (user, req) => {
      if (req && user && user.type() === 'esia') {
        const logoutEsiaUrl = new url.URL(url.resolve(this.portalUrl, '/idp/ext/Logout'));
        const params = new url.URLSearchParams(logoutEsiaUrl.search);
        params.set('client_id', this.mnemonik);
        if (this.redirectLogoutUrl) {
          params.set('redirect_url', this.redirectLogoutUrl);
        }
        logoutEsiaUrl.search = params;
        req.session.logoutRedirect = logoutEsiaUrl.toString();
      }
    });
  }
}

util.inherits(EsiaStrategy, Strategy);

// jshint maxstatements:50
Strategy.prototype.authenticate = function (req) {
  const _this = this;

  function verified(err, user, info) {
    if (err) {
      return _this.error(err);
    }
    if (!user) {
      return _this.fail(info);
    }
    req.login(user, (err) => {
      if (err) {
        return _this.error(err);
      }
      _this.success(user, info);
    });
  }

  if (req.path.slice(-8) === 'callback') {
    if (!req.query.code || !req.query.state) {
      return _this.fail('Ошибка подключения к ЕСИА');
    }
    const oldState = req.session.esiaState;
    delete req.session.esiaState;
    if (oldState !== req.query.state) {
      return _this.fail('Ошибка подключения к ЕСИА');
    }

    const timestamp = moment().format('YYYY.MM.DD HH:mm:ss ZZ');
    const state = uuidv4();
    const msg = _this.scope + timestamp + _this.mnemonik + state;
    let token, refreshToken;
    return _this._encrypt(msg)
      .then((secret) => {
        if (!secret) {
          throw new Error('Ошибка подписи ключа ЕСИА');
        }
        return requester({
          method: 'POST',
          uri: url.resolve(_this.portalUrl, _this.tokenUrl),
          form: {
            client_id: _this.mnemonik,
            code: req.query.code,
            grant_type: 'authorization_code',
            client_secret: urlSafe(secret),
            state,
            redirect_uri: url.resolve(currentUrl(req), _this.redirectUrl),
            scope: _this.scope,
            timestamp,
            token_type: 'Bearer'
          }
        });
      })
      .then((result) => {
        if (!result.access_token) {
          throw new Error('Ошибка авторизации ЕСИА');
        }
        token = result.access_token;
        refreshToken = result.refresh_token;
        return readFilePromise(_this.tokenPk);
      })
      .then((pk) => {
        const payload = jwt.verify(token, pk);
        const oid = payload['urn:esia:sbj_id'];
        return scopeDataRequester(_this.portalUrl, oid, _this.scope, token)
          .then((p) => {
            const profile = {
              oid: String(oid),
              properties: p
            };
            return Object.assign(profile, p);
          });
      })
      .then((profile) => {
        _this._verify(token, refreshToken, profile, verified);
      })
      .catch((err) => {return _this.error(err);});
  } else {
    const timestamp = moment().format('YYYY.MM.DD HH:mm:ss ZZ');
    const state = uuidv4();
    req.session.esiaState = state;

    const msg = _this.scope + timestamp + _this.mnemonik + state;
    return _this._encrypt(msg)
      .then((secret) => {
        if (!secret) {
          return _this.fail('Ошибка подписи ключа ЕСИА');
        }
        const query = {
          timestamp,
          client_id: _this.mnemonik,
          redirect_uri: url.resolve(currentUrl(req), _this.redirectUrl),
          scope: _this.scope,
          response_type: 'code',
          state,
          access_type: 'online',
          client_secret: urlSafe(secret)
        };

        const authUrl = `${url.resolve(_this.portalUrl, _this.codeUrl)}?${querystring.stringify(query)}`;
        return _this.redirect(authUrl, 302);
      });
  }
};

exports = module.exports = EsiaStrategy; // eslint-disable-line
exports.Strategy = EsiaStrategy;
