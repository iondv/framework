/**
 * Created by kras on 16.11.16.
 */
'use strict';
const PropertyTypes = require('core/PropertyTypes');
const Item = require('core/interfaces/DataRepository').Item;

// jshint maxstatements: 50, maxcomplexity: 30, maxdepth: 20
/**
 * @param {*} data
 * @param {Function} dateCallback
 * @param {{}} [options]
 * @param {{}} [processed]
 * @returns {{} | null}
 * @private
 */
function normalize(data, dateCallback, options, processed) {
  var i;
  options = options || {};
  processed = processed || {};
  if (Array.isArray(data)) {
    var result = [];
    for (i = 0; i < data.length; i++) {
      result.push(normalize(data[i], dateCallback, options, processed));
    }
    return result;
  }

  if (data instanceof Item) {
    /**
     * @type {{}}
     */
    var item;
    var nm, p, refItem;
    var props = data.getProperties();
    if (!options.greedy) {
      if (processed.hasOwnProperty(data.getClassName() + '@' + data.getItemId())) {
        item = processed[data.getClassName() + '@' + data.getItemId()];
        for (nm in props) {
          if (props.hasOwnProperty(nm)) {
            /**
             * @type {Property}
             */
            p = props[nm];

            if (p.getType() === PropertyTypes.REFERENCE) {
              if (typeof item[p.getName()] !== 'object') {
                refItem = data.getAggregate(p.getName());
                if (refItem) {
                  item[p.getName()] = normalize(refItem, dateCallback, options, processed);
                }
              }
            } else if (p.getType() === PropertyTypes.COLLECTION) {
              if (!Array.isArray(item[p.getName()])) {
                item[p.getName()] = normalize(data.getAggregates(p.getName()), dateCallback, options, processed);
              }
            }
          }
        }
        return item;
      }
    }

    item = {};

    item.className = data.getMetaClass().getCanonicalName();
    item._creator = data.getCreator();
    item._editor = data.getEditor();
    processed[data.getClassName() + '@' + data.getItemId()] = item;

    for (nm in props) {
      if (props.hasOwnProperty(nm)) {
        /**
         * @type {Property}
         */
        p = props[nm];

        if (p.getType() === PropertyTypes.REFERENCE) {
          refItem = data.getAggregate(p.getName());
          if (refItem) {
            item[p.getName()] = normalize(refItem, dateCallback, options, processed);
          } else if (item[p.getName()]) {
            delete item[p.getName()];
          }
        } else if (p.getType() === PropertyTypes.COLLECTION) {
          item[p.getName()] = normalize(data.getAggregates(p.getName()), dateCallback, options, processed);
        } else {
          item[p.getName()] = p.getValue();
        }

        if (p.meta.selectionProvider) {
          item[p.getName() + '_str'] = p.getDisplayValue(dateCallback);
        }
      }
    }

    item._id = data.getItemId();
    item.__string = data.toString(null, dateCallback);
    return item;
  }

  return null;
}

module.exports = normalize;
