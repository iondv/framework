/**
 * Created by kras on 03.11.16.
 */
'use strict';
const c = require('../arithmetic/incOper');

module.exports = c((a, b) => (a || '') + (b || ''), '');

