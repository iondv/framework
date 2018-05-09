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

function infoRequester(uri, token, schema) {
  return new Promise(((resolve, reject) => {
    request({
      uri: uri,
      auth: {bearer: token},
      headers: {
        Accept: "*/*" + (schema ? `; schema=\"${schema}\"` : "")
      }
    }, (err, req, body) => {
      if (err) {
        //TODO Кажется тут должен вызываться fail стратегии
        return reject(err);
      }
      try {
        const result = JSON.parse(body);
        resolve(result);
      } catch (err) {
        //TODO А тут error
        reject(err);
      }
    });
  }));
}

function pkcs7encrypt(message, cer, key, password) {
  try {
    const certOrCertPem = fs.readFileSync(cer, {encoding: 'utf-8'});
    const privateKeyAssociatedWithCert = fs.readFileSync(key, {encoding: 'utf-8'});

    const p7 = forge.pkcs7.createSignedData();
    p7.content = forge.util.createBuffer(message, 'utf8');
    p7.addCertificate(certOrCertPem);
    p7.addSigner({
      key: privateKeyAssociatedWithCert,
      certificate: certOrCertPem,
      digestAlgorithm: forge.pki.oids.sha256,
      authenticatedAttributes: [{
        type: forge.pki.oids.contentType,
        value: forge.pki.oids.data
      }, {type: forge.pki.oids.messageDigest}, {
        type: forge.pki.oids.signingTime,
        value: new Date()
      }]
    });
    p7.sign();
    const pem = forge.pkcs7.messageToPem(p7);
    const secret = pem.split('\r\n').slice(1, -2)
      .join('');
    return secret;
  } catch (err) {
    console.log(err);
    return null;
  }
}

function currentUrl(req) {
  return url.format({
    protocol: req.protocol,
    host: req.get('host')
  });
}

function urlSafe(str) {
  return str.trim().split('+')
    .join('-')
    .split('/')
    .join('_')
    .replace('=', '');
}

const scopeTypes = {
  PERSON: ['fullname', 'birthdate', 'gender', 'snils', 'inn', 'birthplace'],
  CONTACTS: ['email', 'mobile', 'contacts'],
  ORGANIZATIONS: ['user_org']
};

function getElementType(element) {
  if (element && element.type) {
    switch (element.type) {
      case 'EML': return 'email';
      case 'MBT': return 'mobile';
      case 'PHN': return 'phone';
      case 'CEM': return 'corps_email';
      default: return null;
    }
  }
  return null;
}

function hasScopes (scope, scopes) {
  return new RegExp(scopes.join("|")).test(scope);
}

function scopeDataRequester(oid, token) {
  let _this = this;
  let properties = {};
  let promises = Promise.resolve();

  if (hasScopes(_this.scope, scopeTypes.PERSON)) {
    promises = promises.then(() => {
      return infoRequester(url.resolve(_this.portalUrl, join('rs/prns', String(oid))), token, _this.personInfoSchema);
    }).then((result) => {
      properties.fullname = result.firstName + " " + result.lastName;
      Object.assign(properties, result);
    });
  }

  if (hasScopes(_this.scope, scopeTypes.CONTACTS)) {
    promises = promises.then(() => {
      return infoRequester(
        url.resolve(_this.portalUrl, `rs/prns/${String(oid)}/ctts?embed=(elements)`),
        token,
        _this.contactInfoSchema);
    }).then((res) => {
      if (res && Array.isArray(res.elements)) {
        res.elements.forEach((e) => {
          const elementType = getElementType(e);
          if (elementType && e.value) {
            properties[elementType] = e.value;
          }
        });
      }
    });
  }
  if (hasScopes(_this.scope, scopeTypes.ORGANIZATIONS)) {
    promises = promises.then(() => {
      return infoRequester(
        url.resolve(_this.portalUrl, `rs/prns/${String(oid)}/roles`),
        token,
        _this.organizationInfoSchema);
    }).then((res) => {
      if (res && Array.isArray(res.elements)) {
        properties.organizations = res.elements;
      }
    });
  }
  return promises.then(() => {
    let profile = {
      oid: String(oid),
      properties: properties
    };
    return Object.assign(profile, properties);
  });
}

/**
 *
 * @param options
 * @param verify
 * @constructor
 */
function EsiaStrategy(options, verify) {
  // jshint maxcomplexity:false
  options = options || {};
  Strategy.call(this, options, verify);
  if (!options.cer || !options.key || !options.mnemonik || !options.verify) {
    throw new Error('не указаны обязательные параметры подключения к ЕСИА');
  }
  this.access_type = options.access_type || 'online';
  this.personInfoSchema = options.personInfoSchema || '';
  this.contactInfoSchema = options.contactInfoSchema || '';
  this.organizationInfoSchema = options.organizationInfoSchema || '';
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
  this._encrypt = function(msg) {
    return pkcs7encrypt(msg, this.cer, this.key, this.password);
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
EsiaStrategy.prototype.authenticate = function (req) {
  const _this = this;

  function verified(err, user, info) {
    if (err)
      return _this.error(err);
    if (!user)
      return _this.fail(info);
    req.login(user, (err) => {
      if (err)
        return _this.error(err);
      _this.success(user, info);
    });
  }

  if (req.path.slice(-8) === 'callback') {
    if (!req.query.code || !req.query.state) {
      return _this.fail('Ошибка подключения к ЕСИА' + (req.query.error ? ': ' + req.query.error : ''));
    }
    let oldState = req.session.esiaState;
    delete req.session.esiaState;
    if (oldState !== req.query.state) {
      return _this.fail('Идентификатор запроса к ЕСИА был нарушен');
    }

    sendAccessTokenRequest.call(_this, req.query.code, req.query.state, url.resolve(currentUrl(req), _this.redirectUrl),
      function (err, req, body) {
        if (err) {
          return _this.error(err);
        }

        const result = JSON.parse(body);
        if (!result.access_token) {
          return _this.fail('Ошибка авторизации ЕСИА' + (result.error ? ': ' + result.error : ''));
        }

        let oldState = req.session.esiaState;
        delete req.session.esiaState;
        if (oldState !== req.query.state) {
          return _this.fail('Идентификатор запроса к ЕСИА был нарушен');
        }

        const token = result.access_token;
        const refreshToken = this.access_type === 'offline' ? result.refresh_token : null;
        const pk = fs.readFileSync(_this.tokenPk);
        const payload = jwt.verify(token, pk);
        const oid = payload['urn:esia:sbj_id'];
        return scopeDataRequester.call(this, oid, token)
          .then((profile) => {
            _this._verify(profile, verified);
          }).catch((err) => {
            return _this.error(err);
          });
      }
    );
  } else {
    const state = uuidv4();
    req.session.esiaState = state;
    sendAuthCodeRequest.call(_this, state, url.resolve(currentUrl(req), this.redirectUrl));
  }
};

function sendAccessTokenRequest (auth_code, state, redirect_uri, callback) {
  const timestamp = moment().format('YYYY.MM.DD HH:mm:ss ZZ');
  const msg = this.scope + timestamp + this.mnemonik + state;
  const secret = this._encrypt(msg);
  if (!secret) {
    return this.fail('Ошибка подписи ключа ЕСИА');
  }

  request({
    method: 'POST',
    uri: url.resolve(this.portalUrl, this.tokenUrl),
    form: {
      client_id: this.mnemonik,
      code: auth_code,
      grant_type: 'authorization_code',
      client_secret: urlSafe(secret),
      state,
      redirect_uri: redirect_uri,
      scope: this.scope,
      timestamp,
      token_type: 'Bearer'
    }
  }, callback);
}

function sendAuthCodeRequest (state, redirect_uri) {
  const timestamp = moment().format('YYYY.MM.DD HH:mm:ss ZZ');
  const msg = this.scope + timestamp + this.mnemonik + state;
  const secret = this._encrypt(msg);
  if (!secret) {
    return this.fail('Ошибка подписи ключа ЕСИА');
  }

  const query = {
    timestamp,
    client_id: this.mnemonik,
    redirect_uri: redirect_uri,
    scope: this.scope,
    response_type: 'code',
    state,
    access_type: this.access_type,
    client_secret: urlSafe(secret)
  };

  const authUrl = `${url.resolve(this.portalUrl, this.codeUrl)}?${querystring.stringify(query)}`;
  this.redirect(authUrl, 302);
}

exports = module.exports = EsiaStrategy;
exports.Strategy = EsiaStrategy;
