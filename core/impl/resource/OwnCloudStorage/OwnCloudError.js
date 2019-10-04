class OwnCloudError extends Error {
  /**
   * @param {String} message
   * @param {String|Number} [statusCode]
   */
  constructor(message, statusCode, response) {
    super(message);
    this.statusCode = statusCode;
    this.response = response;
    this.name = 'OwnCloudError';
  }
}

module.exports = OwnCloudError;
