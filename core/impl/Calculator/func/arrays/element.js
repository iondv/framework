/**
 * Created by kras on 25.09.17.
 */
'use strict';
const calc = require('../util').calculate;

module.exports = function (args) {
  return function () {
   return calc(this, args, null,
     function (args) {
       let arr = [];
       let ind = 0;
       if (args.length > 0) {
         if (Array.isArray(args[0])) {
           arr = args[0];
         }
       }
       if (args.length > 1) {
         ind = args[1];
         if (ind === 'last') {
           ind = arr.length - 1;
         }
       }
       if (typeof arr[ind] !== 'undefined') {
         return arr[ind];
       }
       return null;
     }
   );
  };
};