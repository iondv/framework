/**
 * Created by Данил on 10.10.2016.
 */
'use strict';

const PropertyTypes = require('core/PropertyTypes');
const ConditionTypes = require('core/ConditionTypes');
const OperationTypes = require('core/OperationTypes');

function toScalar(v) {
  if (Array.isArray(v) && v.length) {
    return v.length ? v[0] : null;
  }
  return v;
}

/**
 * @param {ClassMeta} rcm
 * @param {{}} condition
 * @returns {{}}
 */
function ConditionParser(rcm, condition, metaRepo) {

  var result = {};

  function produceContainsFilter() {
    var pm = rcm.getPropertyMeta(condition.property);
    if (pm) {
      if (pm.type === PropertyTypes.COLLECTION && pm.itemsClass) {
        var ccm, aggr, match;
        if (condition.value && condition.value.length) {
          if (pm.backRef) {
            ccm = metaRepo.getMeta(pm.itemsClass, rcm.getVersion(), rcm.getNamespace());
            if (ccm) {
              aggr = [];
              aggr.push({$lookup: {
                from: tn(ccm),
                localField: rcm.getKeyProperties()[0],
                foreignField: pm.backRef,
                as: '__lookup'
              }});

              match = {$match: {}};
              match.$match['__lookup.' + ccm.getKeyProperties()[0]] = {$all: contition.value};
              aggr.push(match);
            }
          } else if (pm.backColl) {
            ccm = metaRepo.getMeta(pm.itemsClass, rcm.getVersion(), rcm.getNamespace());
            if (ccm) {
              aggr = {
                property: condition.property,
                stages: []
              };
              aggr.stages.push({$unwind: '$' + pm.name});
              aggr.stages.push({$lookup: {
                from: ccm.getCanonicalName(),
                localField: pm.name,
                foreignField: ccm.getKeyProperties()[0],
                as: '__lookup'
              }});

              match = {$match: {}};
              match.$match['__lookup.' + ccm.getKeyProperties()[0]] = {$in: condition.value};
              aggr.stages.push(match);
              result[condition.property] = {_exists: aggr};
            }
          } else {
            result[condition.property] = {$all: condition.value};
          }
        } else if (condition.nestedConditions && condition.nestedConditions.length) {
          if (pm.backRef) {
            aggr = [];
            aggr.push({$lookup: {
              from: pm.itemsClass,
              localField: rcm.getKeyProperties()[0],
              foreignField: pm.backRef,
              as: '__lookup'
            }});

            match = {$match: {}};
            match.$match['__lookup.' + ''] = {$all: contition.value};
            aggr.push(match);

          } else if (pm.backColl) {

          } else {
            result[condition.property] = {$all: condition.value};
          }
        } else {
          throw new Error('неправильное условие');
        }
      } else if (pm.type === PropertyTypes.STRING && condition.value) {
        result[condition.property] = {$regex: toScalar(condition.value)};
      } else {
        throw new Error('неправильное условие');
      }
    } else {
      throw new Error('неправильное условие, не найдено property');
    }
  }

  if (condition.property) {
    switch (condition.operation) {
      case ConditionTypes.EMPTY: {
        result.$or = [{}, {}, {}];
        result.$or[0][condition.property] = {$eq: null};
        result.$or[1][condition.property] = {$eq: ''};
        result.$or[2][condition.property] = {$exists: false};
      } break;
      case ConditionTypes.NOT_EMPTY: {
        result.$and = [{}, {}, {}];
        result.$and[0][condition.property] = {$ne: null};
        result.$and[1][condition.property] = {$ne: ''};
        result.$and[2][condition.property] = {$exists: true};
      } break;
      case ConditionTypes.CONTAINS: produceContainsFilter(); break;
      case ConditionTypes.EQUAL: result[condition.property] = {$eq: toScalar(condition.value)}; break;
      case ConditionTypes.NOT_EQUAL: result[condition.property] = {$ne: toScalar(condition.value)}; break;
      case ConditionTypes.LIKE: result[condition.property] = {$regex: new RegExp(toScalar(condition.value))}; break;
      case ConditionTypes.LESS: result[condition.property] = {$lt: toScalar(condition.value)}; break;
      case ConditionTypes.MORE: result[condition.property] = {$gt: toScalar(condition.value)}; break;
      case ConditionTypes.LESS_OR_EQUAL: result[condition.property] = {$lte: toScalar(condition.value)}; break;
      case ConditionTypes.MORE_OR_EQUAL: result[condition.property] = {$gte: toScalar(condition.value)}; break;
      case ConditionTypes.IN: result[condition.property] = {$in: condition.value}; break;
    }
  } else {
    var value = [];
    for (var i = 0; i < condition.nestedConditions.length; i++) {
      value[value.length] = ConditionParser(condition.nestedConditions[i]);
    }
    switch (condition.operation) {
      case OperationTypes.AND: result.$and = value; break;
      case OperationTypes.OR: result.$or = value; break;
      case OperationTypes.NOT: result.$not = {$and: value}; break;
    }
  }
  return result;
}

module.exports = ConditionParser;
