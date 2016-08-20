/**
 * Created by Данил on 04.08.2016.
 */

'use strict';

var DigiSignCoreModule = require('core/interfaces/DigitalSignature');
var IDigiSignModel = DigiSignCoreModule.IDigiSignModel;

/**
 * @param {DataSource} ds
 * @constructor
 */
function DigiSignModel(options) {
  var _this = this;
  /**
   * @type {DataSource}
   */
  this.ds = options.dataSource;

  this._addSign = function (action, actor, className, objId, attributes, sign, data, part) {
    return new Promise(function (resolve, reject) {
      _this.ds.insert('ion_digisigns', {
        timeStamp: new Date().toISOString(),
        action: action,
        actor: actor,
        className: className,
        part: typeof part === 'number' ? part : 0,
        objId: objId,
        attributes: attributes,
        data: data,
        sign: sign
      }).then(function (item) {
        resolve(
          new DigiSignCoreModule.DigitalSignature(
            Date.parse(item.timeStamp),
            item.action,
            item.actor,
            item.className,
            item.part,
            item.objId,
            item.attributes,
            item.data,
            item.sign
          )
        );
      }).catch(reject);
    });
  };

  this._getSigns = function (className, objId, action, since, till) {
    return new Promise(function (resolve, reject) {
      var opts = {className: className, objId: objId};
      if (typeof action === 'string') {
        opts.action = action;
      }
      if (typeof since !== 'undefined' && since instanceof Date) {
        opts.timeStamp.$gte = since.toISOString();
      }
      if (typeof till !== 'undefined' && till instanceof Date) {
        opts.timeStamp.$lt = till.toISOString();
      }
      _this.ds.fetch('ion_digisigns', {filter: opts, sort: {timestamp: 1}}).then(
        function (signatures) {
          var result = [];
          for (var i = 0; i < signatures.length; i++) {
            result.push(new DigiSignCoreModule.DigitalSignature(
              Date.parse(signatures[i].timeStamp),
              signatures[i].action,
              signatures[i].actor,
              signatures[i].className,
              signatures[i].part,
              signatures[i].objId,
              signatures[i].attributes,
              signatures[i].data,
              signatures[i].sign
            ));
          }
          resolve(result);
        }
      ).catch(reject);
    });
  };
}

DigiSignModel.prototype = new IDigiSignModel();
module.exports = DigiSignModel;
