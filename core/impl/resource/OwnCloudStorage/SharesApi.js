const url = require('url');
const OwnCloudError = require('./OwnCloudError');
const {urlResolver, slashChecker} = require('./util');
const ShareAccessLevel = require('core/interfaces/ResourceStorage/lib/ShareAccessLevel');
const requester = require('core/util/request');

const urlTypes = {
  OCS: 'ocs/v1.php/apps/files_sharing/api/v1/shares',
  SHARE: 'index.php/s/'
};

function produceShare(obj) {
  if (Array.isArray(obj)) {
    const result = [];
    obj.forEach(o => result.push(produceShare(o)));
    return result;
  }
  const shareOptions = {
    id: obj.id,
    token: obj.token,
    shareType: obj.share_type,
    shareUrl: obj.url,
    passwordSet: obj.share_type === 3 ? Boolean(obj.share_with) : false,
    permissions: obj.permissions,
    expiration: obj.expiration
  };
  return shareOptions;
}

function parseShareResponse(body) {
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (err) {
      throw new OwnCloudError('Invalid reponse from owncloud server', null, body);
    }
  }

  if (body.ocs && body.ocs.meta && body.ocs.meta.status === 'failure') {
    throw new OwnCloudError(body.ocs.meta.message, body.ocs.meta.statuscode);
  }

  if (!body.ocs || !body.ocs.data) {
    throw new OwnCloudError('Unknown result of operation');
  }

  return produceShare(body.ocs.data);
}

class SharesApi {

  /**
   * @param {{}} options
   * @param {String} options.url
   * @param {String} options.login
   * @param {String} options.password
   */
  constructor(options) {
    if (!options.url || !options.login || !options.password) {
      throw new Error('connection parameters are not specified (url, login, password)');
    }

    this.options = options;
    this.cloudUrlObj = url.parse(options.url, true);
    this.cloudUrl = encodeURI(urlResolver(slashChecker(this.options.url), urlTypes.OCS));
  }

  /**
   * @param {String} level
   * @returns {String}
   */
  accessLevel(level) {
    switch (level) {
      case ShareAccessLevel.READ: return '1';
      case ShareAccessLevel.WRITE: return '15';
      default:
        throw new Error('Invalid access level value!');
    }
  }

  /**
   * @param {String} share
   * @returns {String}
   */
  parseToken(share) {
    let result;
    const urlObj = url.parse(share, true);
    if (urlObj.host === this.cloudUrlObj.host) {
      if (urlObj.path.indexOf(urlTypes.SHARE) > -1) {
        result = urlObj.path.replace(`/${urlTypes.SHARE}`, '');
      }
    } else if (!urlObj.host) {
      result = share;
    }
    if (typeof result === 'undefined') {
      throw new Error('Invalid share address was passed');
    }

    return result;
  }

  /**
   * @param {String} [path]
   * @returns {Promise}
   */
  get(path) {
    const req = {
      method: 'GET',
      uri: this.cloudUrl,
      qs: {
        format: 'json'
      },
      headers: {'OCS-APIRequest': true},
      auth: {
        user: this.options.login,
        password: this.options.password
      }
    };
    if (typeof path === 'string') {
      req.qs.path = path;
    }
    return requester(req).then(body => parseShareResponse(body));
  }

  /**
   * @param {String} id
   * @returns {Promise}
   */
  info(id) {
    const req = {
      method: 'GET',
      uri: slashChecker(this.cloudUrl) + encodeURIComponent(id),
      qs: {format: 'json'},
      headers: {'OCS-APIRequest': true},
      auth: {
        user: this.options.login,
        password: this.options.password
      }
    };
    return requester(req).then(body => parseShareResponse(body));
  }

  /**
   * @param {{}} params
   * @param {String} params.path
   * @param {String | Number} params.shareType
   * @returns {Promise}
   */
  create(params) {
    if (!params || !params.path || !params.shareType) {
      return Promise.reject(new Error('mandatory fields (shareType, path) not specified'));
    }

    const req = {
      method: 'POST',
      uri: this.cloudUrl,
      qs: {format: 'json'},
      headers: {'OCS-APIRequest': true},
      auth: {
        user: this.options.login,
        password: this.options.password
      },
      form: params
    };
    return requester(req).then(body => parseShareResponse(body));
  }

  /**
   * @param {String} id
   * @param {{}} params
   * @returns {Promise}
   */
  update(id, params) {
    const req = {
      method: 'PUT',
      uri: slashChecker(this.cloudUrl) + encodeURIComponent(id),
      qs: {format: 'json'},
      headers: {'OCS-APIRequest': true},
      auth: {
        user: this.options.login,
        password: this.options.password
      },
      form: params
    };
    return requester(req).then(body => parseShareResponse(body));
  }

  /**
   * @param {String} id
   * @returns {Promise}
   */
  delete(id) {
    const req = {
      method: 'DELETE',
      uri: slashChecker(this.cloudUrl) + encodeURIComponent(id),
      qs: {format: 'json'},
      headers: {'OCS-APIRequest': true},
      auth: {
        user: this.options.login,
        password: this.options.password
      }
    };
    return requester(req).then(body => parseShareResponse(body));
  }
}

module.exports = SharesApi;
