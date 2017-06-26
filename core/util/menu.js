/**
 * Created by kalias_90 on 26.06.17.
 */
'use strict';

/* jshint maxcomplexity: 30, maxstatements: 50 */
const GLOBAL_NS = '__global';

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
 * @param {SettingsRepository} settings
 * @param {MetaRepository} repo
 * @param {String} position
 * @param {String[]} [aclResources]
 * @returns {Promise}
 */
module.exports.buildMenu = function (moduleName, settings, repo, position, aclResources) {
  var result, sect, sections, menu, subnodes, subSubnodes;
  result = [];
  menu = position || 'left';

  var navigation = settings.get(moduleName + '.navigation') || {};
  var namespaces = navigation.namespaces || {};
  var menus = navigation.menus || {};
  var types = typeof menus.types !== 'undefined' && menus.types.hasOwnProperty(menu) ? menus.types[menu] : null;
  if (!namespaces.hasOwnProperty(GLOBAL_NS)) {
    namespaces[GLOBAL_NS] = '';
  }
  for (var nm in namespaces) {
    if (namespaces.hasOwnProperty(nm)) {
      var nsType = types !== null ?
        (typeof types.namespaces !== 'undefined' && types.namespaces.hasOwnProperty(nm) ?
          types.namespaces[nm] : types.type) : menuTypes.TREE;
      subnodes = [];
      var secType;
      var nodesTypes;
      if (!menus.hasOwnProperty(menu) || menus[menu].length === 0) {
        sections = repo.getNavigationSections(nm !== GLOBAL_NS ? nm : '');
        var names = Object.keys(sections);
        for (var nm2 in sections) {
          if (sections.hasOwnProperty(nm2)) {
            secType =
              types !== null &&
              typeof types.sections !== 'undefined' &&
              types.sections.hasOwnProperty(nm2) &&
              typeof types.sections[nm2].types !== 'undefined' ? types.sections[nm2].type : nsType;
            nodesTypes =
              types !== null &&
              typeof types.sections !== 'undefined' &&
              types.sections.hasOwnProperty(nm2) && typeof types.sections[nm2].nodes !== 'undefined' ?
                types.sections[nm2].nodes : {};
            subSubnodes = buildSubMenu(sections[nm2].nodes, nodesTypes, secType, aclResources, moduleName);
            if (names.length === 1 && subSubnodes.length > 0) {
              subnodes = subSubnodes;
              break;
            } else {
              subnodes.push({
                id: sections[nm2].name,
                nodes: subSubnodes,
                hint: sections[nm2].caption,
                caption: sections[nm2].caption,
                url: null,
                itemType: sections[nm2].itemType,
                orderNumber: sections[nm2].orderNumber,
                type: typeParser(secType)
              });
            }
          }
        }
      } else {
        for (var i = 0; i < menus[menu].length; i++) {
          sect = repo.getNavigationSection(menus[menu][i], nm !== GLOBAL_NS ? nm : '');
          if (sect) {
            secType =
              types !== null &&
              typeof types.sections !== 'undefined' &&
              types.sections.hasOwnProperty(sect.name) &&
              typeof types.sections[sect.name].type !== 'undefined' ?
                types.sections[sect.name].type : nsType;
            nodesTypes =
              types !== null &&
              typeof types.sections !== 'undefined' &&
              types.sections.hasOwnProperty(sect.name) &&
              typeof types.sections[sect.name].nodes !== 'undefined' ?
                types.sections[sect.name].nodes : {};
            subSubnodes = buildSubMenu(sect.nodes, nodesTypes, secType, aclResources, moduleName);
            if (menus[menu].length === 1 && subSubnodes.length > 0) {
              subnodes = subSubnodes;
              break;
            } else {
              subnodes.push({
                id: sect.name,
                nodes: subSubnodes,
                hint: sect.caption,
                caption: sect.caption,
                url: null,
                itemType: sect.itemType,
                orderNumber: sect.orderNumber,
                type: typeParser(secType)
              });
            }
          }
        }
      }
      if (Object.keys(namespaces).length === 1 && subnodes.length > 0) {
        return subnodes;
      } else {
        if (subnodes.length > 0) {
          result.push({
            id: nm,
            nodes: subnodes,
            hint: namespaces[nm],
            caption: namespaces[nm],
            url: '',
            type: typeParser(nsType)
          });
        }
      }
    }
  }
  orderMenuSections(result);
  return result;
};

function buildSubMenu(nodes, types, defaultType, aclResources, moduleName) {
  var result, i, subnodes, url, external;
  result = [];
  for (i in nodes) {
    if (nodes.hasOwnProperty(i)) {
      var nodeType = types.hasOwnProperty(i) && typeof types[i].type !== 'undefined' ? types[i].type : defaultType;
      subnodes = buildSubMenu(nodes[i].children,
        types.hasOwnProperty(i) && typeof types[i].nodes !== 'undefined' ? types[i].nodes : {},
        nodeType,
        aclResources,
        moduleName);
      if (Object.keys(nodes).length === 1 && subnodes.length > 0) {
        return subnodes;
      } else {
        var aclId = nodeAclId(nodes[i]);
        external = false;
        switch (nodes[i].type) {
          case 0: {url = '';}break;
          case 3: {
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

function orderMenuSections(nodes) {
  var i, subs;
  for (i = 0; i < nodes.length; ++i) {
    subs = nodes[i].nodes;
    if (subs instanceof Array && subs.length && subs[0].itemType === 'section') {
      orderMenu(subs);
    }
  }
}