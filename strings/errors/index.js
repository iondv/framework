/**
 * Created by krasilneg on 25.04.17.
 */
const merge = require('merge');

module.exports = merge(
  require('./auth'),
  require('./data-repo'),
  require('./data-source'),
  require('./di'),
  require('./file-storage'),
  require('./meta-repo'),
  require('./workflow'),
  require('./validation'),
  require('./front-end')
);

