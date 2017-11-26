'use strict';
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

function requester(options) {
  return new Promise(function (resolve, reject) {
    request(options, function (err, req, body) {
      if (err) {
        return reject(err);
      }
      try {
        let result = JSON.parse(body);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  });
}

function pkcs7encrypt(message, cer, key, password) {
  try {
    let certOrCertPem = fs.readFileSync(cer, {encoding: 'utf-8'});
    let privateKeyAssociatedWithCert = fs.readFileSync(key, {encoding: 'utf-8'});

    let p7 = forge.pkcs7.createSignedData();
    p7.content = forge.util.createBuffer(message, 'utf8');
    p7.addCertificate(certOrCertPem);
    p7.addSigner({
      key: privateKeyAssociatedWithCert,
      certificate: certOrCertPem,
      digestAlgorithm: forge.pki.oids.sha256,
      authenticatedAttributes: [{
        type: forge.pki.oids.contentType,
        value: forge.pki.oids.data
      }, {
        type: forge.pki.oids.messageDigest
      }, {
        type: forge.pki.oids.signingTime,
        value: new Date()
      }]
    });
    p7.sign();
    let pem = forge.pkcs7.messageToPem(p7);
    let secret = pem.split('\r\n').slice(1, -2).join('');
    return secret;
  } catch (err) {
    console.log(err);
    return null;
  }
}

function currentUrl(req) {
  return url.format({
    protocol: req.protocol,
    host: req.get('host'),
    pathname: req.originalUrl
  });
}

function urlSafe(str) {
  return str.trim().split('+').join('-').split('/').join('_').replace('=', '');
}

function base64UrlSafeDecode(str) {
  return str.trim().split('-').join('+').split('_').join('/');
}

function EsiaStrategy(options, verify) {
  options = options || {};
  Strategy.call(this, options, verify);
  if (!options.cer || !options.key || !options.mnemonik) {
    this.error(new Error('не указаны обязательные параметры подключения к ЕСИА'));
  }
  this.name = 'esia';
  this.mnemonik = options.mnemonik;
  this.cer = options.cer;
  this.key = options.key;
  this.password = options.password;
  this.scope = options.scope || 'fullname';
  this.redirectUrl = '/callback';
  this.portalUrl = options.portalUrl || 'https://esia-portal1.test.gosuslugi.ru/';
  this.tokenUrl = options.tokenUrl || 'aas/oauth2/te';
  this.codeUrl = options.codeUrl || 'aas/oauth2/ac';
  this.personUrl = options.personUrl || 'rs/prns';
  this._verify = verify;
  this._encrypt = function (msg) {
    return pkcs7encrypt(msg, this.cer, this.key, this.password);
  };
}

util.inherits(EsiaStrategy, Strategy);

// jshint maxstatements:50
Strategy.prototype.authenticate = function (req, options) {
  let _this = this;

  options = options || {};

  function verified(err, user, info) {
    if (err) {
      return _this.error(err);
    }
    if (!user) {
      return _this.fail(info);
    }
    _this.success(user, info);
  }

  if (req.path.slice(-8) === 'callback') {
    if (!req.query.code || !req.query.state) {
      return _this.fail('Ошибка подключения к ЕСИА');
    }
    let oldState = req.session.esiaState;
    delete req.session.esiaState;
    if (oldState !== req.query.state) {
      return _this.fail('Ошибка подключения к ЕСИА');
    }

    let timestamp = moment().format('YYYY.MM.DD HH:mm:ss ZZ');
    let state = uuidv4();
    let msg = _this.scope + timestamp + _this.mnemonik + state;
    let secret = _this._encrypt(msg);
    if (!secret) {
      return _this.fail('Ошибка подписи ключа ЕСИА');
    }

    let post = {
      method: 'POST',
      uri: url.resolve(_this.portalUrl, _this.tokenUrl),
      form: {
        client_id: _this.mnemonik,
        code: req.query.code,
        grant_type: 'authorization_code',
        client_secret: urlSafe(secret),
        state,
        redirect_uri: currentUrl(req),
        scope: _this.scope,
        timestamp,
        token_type: 'Bearer'
      }
    };

    let token, refreshToken;
    requester(post)
      .then(result => {
        if (!result.access_token) {
          throw new Error('Ошибка авторизации ЕСИА');
        }
        token = result.access_token;
        refreshToken = result.refresh_token;
        let parts = token.split('.');
        let tokenObj = JSON.parse((new Buffer(base64UrlSafeDecode(parts[1]), 'base64')).toString());
        let oid = tokenObj['urn:esia:sbj_id'];
        let personInfoUrl = url.resolve(_this.portalUrl, _this.personUrl, oid);
        return requester({uri: personInfoUrl, auth: {bearer: token}});
      })
      .then(profile => {
        _this._verify(token, refreshToken, profile, verified);
      })
      .catch(err => _this.error(err));

  } else {
    let timestamp = moment().format('YYYY.MM.DD HH:mm:ss ZZ');
    let state = uuidv4();
    req.session.esiaState = state;

    let msg = _this.scope + timestamp + _this.mnemonik + state;
    let secret = _this._encrypt(msg);
    if (!secret) {
      return _this.fail('Ошибка подписи ключа ЕСИА');
    }

    let query = {
      timestamp,
      client_id: _this.mnemonik,
      redirect_uri: url.resolve(currentUrl(req), _this.redirectUrl),
      scope: _this.scope,
      response_type: 'code',
      state,
      access_type: 'online',
      client_secret: urlSafe(secret)
    };

    let authUrl = url.resolve(_this.portalUrl, _this.codeUrl) + '?' + querystring.stringify(query);
    _this.redirect(authUrl, 302);
  }

};

exports = module.exports = EsiaStrategy;
exports.Strategy = EsiaStrategy;
