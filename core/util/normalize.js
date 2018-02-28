/**
 * Created by kras on 16.11.16.
 */
'use strict';
const PropertyTypes = require('core/PropertyTypes');
const Item = require('core/interfaces/DataRepository').Item;
const clone = require('clone');

// jshint maxstatements: 50, maxcomplexity: 30, maxdepth: 20
/**
 * @param {*} data
 * @param {Function} dateCallback
 * @param {{}} [options]
 * @param {Boolean | Number} [options.greedy]
 * @param {Boolean} [options.skipSystemAttrs]
 * @param {Boolean} [options.byRef]
 * @param {{}} [processed]
 * @returns {{} | null}
 * @private
 */
function normalize(data, dateCallback, options, processed) {
  options = options || {};
  processed = processed || {};
  if (Array.isArray(data)) {
    let result = [];
    for (let i = 0; i < data.length; i++) {
      result.push(normalize(data[i], dateCallback, options, processed));
    }
    return result;
  }

  if (data instanceof Item) {
    if (processed.hasOwnProperty(data.getClassName() + '@' + data.getItemId())) {
      if (options.byRef) {
        return processed[data.getClassName() + '@' + data.getItemId()];
      } else {
        if (options.greedy) {
          return clone(
            processed[data.getClassName() + '@' + data.getItemId()],
            true,
            isNaN(options.greedy) ? 1 : options.greedy
          );
        }
        return {
          __class: processed[data.getClassName() + '@' + data.getItemId()].className,
          _id: processed[data.getClassName() + '@' + data.getItemId()]._id
        };
      }
    }
    /**
     * @type {{}}
     */
    let item;
    let props = data.getProperties();

    item = {};

    if (!options.skipSystemAttrs) {
      item._creator = data.getCreator();
      item._editor = data.getEditor();
      item._id = data.getItemId();
      item.__string = data.toString(null, dateCallback);
    }
    processed[data.getClassName() + '@' + data.getItemId()] = item;

    for (let nm in props) {
      if (props.hasOwnProperty(nm)) {
        /**
         * @type {Property}
         */
        let p = props[nm];
        if (options.skipSystemAttrs && (p.getName() === '__class' || p.getName() === '__classTitle')) {
          continue;
        }
        
        if (p.getType() === PropertyTypes.REFERENCE) {
          let refItem = data.getAggregate(p.getName());
          if (refItem && typeof item[p.getName()] === 'undefined') {
            item[p.getName()] = normalize(refItem, dateCallback, options, processed);
          }
        } else if (p.getType() === PropertyTypes.COLLECTION) {
          if (typeof item[p.getName()] === 'undefined') {
            item[p.getName()] = normalize(data.getAggregates(p.getName()), dateCallback, options, processed);
          }
        } else {
          item[p.getName()] = p.getValue();
        }

        if (p.meta.selectionProvider && !options.skipSystemAttrs) {
          item[p.getName() + '_str'] = p.getDisplayValue(dateCallback);
        }
      }
    }
    return item;
  }

  return null;
}

module.exports = normalize;
