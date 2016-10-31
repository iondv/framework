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

function createLookupMatch(lookupProperty, condition) {
  var match = {$match: {}};
  if (condition.value && condition.value.length) {
    match.$match['__lookup.' + lookupProperty] = {$all: condition.value};
  } else if (condition.nestedConditions && condition.nestedConditions.length) {
    var and = [];
    for (var i = 0; i < condition.nestedConditions.length; i++) {
      if (condition.nestedConditions[i].operation !== ConditionTypes.CONTAINS) {
        condition.nestedConditions[i].property = '__lookup.' + condition.nestedConditions[i].property;
        and.push(ConditionParser(null, condition.nestedConditions[i]));
      }
    }
    match.$match.$and = and;
  } else {
    throw new Error('неправильное условие');
  }
  return match;
}

function createGroupObject(cm) {
  var group = {$group: {}};
  group.$group._id = '$_id';
  group.$group._class = {$first: '$_class'};
  group.$group._classVer = {$first: '$_classVer'};
  group.$group.__lookup = {$push: '$__lookup'};

  var properties = cm.getPropertyMetas();
  for (var i = 0; i < properties.length; i++) {
    group.$group[properties[i].name] = {$first: '$' + properties[i].name};
  }

  return group;
}

function produceContainsFilter(rcm, condition, metaRepo, result) {
  var pm = rcm.getPropertyMeta(condition.property);
  if (pm) {
    if (pm.type === PropertyTypes.COLLECTION && pm.itemsClass) {
      var ccm, aggr;
      if (pm.backRef) {
        ccm = metaRepo.getMeta(pm.itemsClass, rcm.getVersion(), rcm.getNamespace());
        if (ccm) {
          aggr = {
            property: condition.property,
            stages: []
          };
          aggr.stages.push({$lookup: {
            from: ccm.getCanonicalName(),
            localField: rcm.getKeyProperties()[0],
            foreignField: pm.backRef,
            as: '__lookup'
          }});
          aggr.stages.push(createLookupMatch(ccm.getKeyProperties()[0], condition));
          result[condition.property] = {_exists: aggr};
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
          aggr.stages.push({$unwind: '$__lookup'});
          aggr.stages.push(createGroupObject(rcm));
          aggr.stages.push(createLookupMatch(ccm.getKeyProperties()[0], condition));
          result[condition.property] = {_exists: aggr};
        }
      } else {
        result[condition.property] = {$all: condition.value};
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

/**
 * @param {ClassMeta} rcm
 * @param {{}} condition
 * @param {MetaRepository} metaRepo
 * @returns {{}}
 */
function ConditionParser(rcm, condition, metaRepo) {

  var result = {};

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
      case ConditionTypes.CONTAINS: produceContainsFilter(rcm, condition, metaRepo, result); break;
      case ConditionTypes.EQUAL: {
        if (condition.value) {
          result[condition.property] = {$eq: toScalar(condition.value)};
        } else if (condition.nestedConditions && condition.nestedConditions.length) {
          result[condition.property] = {$eq: ConditionParser(rcm, condition.nestedConditions[0], metaRepo)};
        }
      } break;
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

    if (condition.nestedConditions) {
      for (var i = 0; i < condition.nestedConditions.length; i++) {
        value[value.length] = ConditionParser(rcm, condition.nestedConditions[i], metaRepo);
      }
    }

    switch (condition.operation) {
      case OperationTypes.AND: result.$and = value; break;
      case OperationTypes.OR: result.$or = value; break;
      case OperationTypes.NOT: result.$not = {$and: value}; break;
      case OperationTypes.MIN: {
        if (condition.value) {
          result._min = condition.value;
        } else {
          throw new Error('не правильное условие MIN');
        }
      } break;
      case OperationTypes.MAX: {
        if (condition.value) {
          result._max = condition.value;
        } else {
          throw new Error('не правильное условие MAX');
        }
      } break;
    }
  }
  return result;
}

module.exports = ConditionParser;
