/**
 * Created by kalias_90 on 26.06.17.
 */
'use strict';

/* jshint maxcomplexity: 30, maxstatements: 50 */

const NodeTypes = {
  GROUP: 0,
  CLASS: 1,
  CONTAINER: 2,
  HYPERLINK: 3
}

const menuTypes = {
  TREE: 'tree',
  COMBO: 'combo'
};
module.exports.menuTypes = menuTypes;

function typeParser(type) {
  switch (type) {
    case menuTypes.TREE:
    case menuTypes.COMBO: return type;
    case 'TREE': return menuTypes.TREE;
    case 'COMBO': return menuTypes.COMBO;
    default: return menuTypes.TREE;
  }
}

function nodeAclId(node) {
  return node ? 'n:::' + (node.namespace ? node.namespace + '@' : '') + node.code : '';
}

module.exports.nodeAclId = nodeAclId;

/**
 * @param {String} moduleName
 * @param {{}} scope
 * @param {SettingsRepository} scope.settings
 * @param {MetaRepository} scope.metaRepo
 * @param {String} position
 * @param {String[]} [aclResources]
 * @returns {Promise}
 */
module.exports.buildMenu = function (moduleName, scope, position, aclResources) {
  position = position || 'left';
  let result = [];
  let navigation = scope.settings.get(moduleName + '.navigation');
  let menus = navigation.menus || {};
  let types = menus.types && menus.types.hasOwnProperty(position) ? menus.types[position] : null;

  if (!menus.hasOwnProperty(position) || menus[position].length === 0) {
    let sections = scope.metaRepo.getNavigationSections();
    for (let s in sections) {
      if (sections.hasOwnProperty(s)) {
        result.push(processingSection(sections[s], types, aclResources, moduleName));
      }
    }
  } else {
    for (let i = 0; i < menus[position].length; i++) {
      let section = scope.metaRepo.getNavigationSection(menus[position][i]);
      if (section) {
        result.push(processingSection(section, types, aclResources, moduleName));
      }
    }
  }

  orderMenu(result);
  return result;
};

function processingSection(section, types, aclResources, moduleName) {
  let secType = types.sections && types.sections.hasOwnProperty(section.name) && types.sections[section.name].type ?
    types.sections[section.name].type : types.type ? types.type : menuTypes.TREE;
  let nodesTypes = types.sections && types.sections.hasOwnProperty(section.name) && types.sections[section.name].nodes ?
    types.sections[section.name].nodes : {};
  return {
    id: section.name,
    nodes: processingNodes(section.nodes, nodesTypes, secType, aclResources, moduleName),
    hint: section.caption,
    caption: section.caption,
    url: null,
    itemType: section.itemType,
    orderNumber: section.orderNumber,
    type: typeParser(secType)
  };
}

function processingNodes(nodes, types, defaultType, aclResources, moduleName) {
  let result = [];
  for (let i in nodes) {
    if (nodes.hasOwnProperty(i)) {
      let nodeType = types.hasOwnProperty(i) && types[i].type ? types[i].type : defaultType;
      let subnodes = processingNodes(nodes[i].children,
        types.hasOwnProperty(i) && types[i].nodes ? types[i].nodes : {},
        nodeType,
        aclResources,
        moduleName);
      if (Object.keys(nodes).length === 1 && subnodes.length > 0) {
        return subnodes;
      } else {
        let aclId = nodeAclId(nodes[i]);
        let external = false;
        let url;
        switch (nodes[i].type) {
          case NodeTypes.GROUP: {url = '';}break;
          case NodeTypes.HYPERLINK: {
            url = nodes[i].url;
            external = nodes[i].external || false;
          }break;
          default: {
            url = '/' + moduleName + '/' + (nodes[i].namespace ? nodes[i].namespace + '@' : '') + nodes[i].code;
            if (Array.isArray(aclResources)) {
              if (aclResources.indexOf(aclId) < 0) {
                aclResources.push(aclId);
              }
            }
          }break;
        }

        result.push({
          id: nodes[i].code,
          nodes: subnodes,
          hint: nodes[i].hint,
          caption: nodes[i].caption,
          url: url,
          external: external,
          orderNumber: nodes[i].orderNumber,
          type: typeParser(nodeType),
          aclId: aclId
        });
      }
    }
  }
  orderMenu(result);
  return result;
}

function orderMenu(nodes) {
  nodes.sort(function (a, b) {
    a = a.orderNumber;
    b = b.orderNumber;
    return a === undefined ? b === undefined ? 0 : 1 : b === undefined ? -1 : a - b;
  });
}