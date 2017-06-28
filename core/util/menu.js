/**
 * Created by kalias_90 on 26.06.17.
 */
'use strict';

const NodeTypes = {
  GROUP: 0,
  CLASS: 1,
  CONTAINER: 2,
  HYPERLINK: 3
};
module.exports.NodeTypes = NodeTypes;

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

function orderMenu(nodes) {
  nodes.sort(function (a, b) {
    a = a.orderNumber;
    b = b.orderNumber;
    return a === undefined ? b === undefined ? 0 : 1 : b === undefined ? -1 : a - b;
  });
}

module.exports.orderMenu = orderMenu;

/* jshint maxcomplexity: 30, maxstatements: 50, maxparams: 10 */

/**
 * @param {String} moduleName
 * @param {{}} scope
 * @param {SettingsRepository} scope.settings
 * @param {MetaRepository} scope.metaRepo
 * @param {String[]} [aclResources]
 */
function MenuBuilder(moduleName, scope, aclResources) {
  this.GLOBAL_NS = '__global';
  this.moduleName = moduleName;
  this.aclResources = aclResources;
  this.metaRepo = scope.metaRepo;
  let navigation = scope.settings.get(moduleName + '.navigation') || {};
  this.namespaces = navigation.namespaces || {};
  this.menuSettings = navigation.menus || {};
  this.skipSinglesSubnodes = true;
}

/**
 * @param {String} position
 * @returns {{}}
 */
MenuBuilder.prototype.buildMenu = function (position) {
  position = position || 'left';
  let result = [];
  let types = this.menuSettings.types && this.menuSettings.types.hasOwnProperty(position) ?
    this.menuSettings.types[position] : null;
  if (!this.namespaces.hasOwnProperty(this.GLOBAL_NS)) {
    this.namespaces[this.GLOBAL_NS] = '';
  }

  for (let nm in this.namespaces) {
    if (this.namespaces.hasOwnProperty(nm)) {
      let nmNode = this.processingNamespace(nm, this.namespaces[nm], types, this.menuSettings[position]);
      if (nmNode.nodes.length > 0) {
        result.push(nmNode);
      }
    }
  }

  if (result.length === 1) {
    return result[0].nodes;
  }
  return result;
};

/**
 * @param {String} namespace
 * @param {String} namespaceTitle
 * @param {{}} types
 * @param {{}} menu
 * @returns {{}}
 */
MenuBuilder.prototype.processingNamespace = function (namespace, namespaceTitle, types, menu) {
  let nsType = types !== null ? types.namespaces && types.namespaces.hasOwnProperty(namespace) ?
    types.namespaces[namespace] : types.type : menuTypes.TREE;
  let subnodes = [];

  if (menu && menu.length > 0) {
    for (let i = 0; i < menu.length; i++) {
      let section = this.metaRepo.getNavigationSection(menu[i], namespace !== this.GLOBAL_NS ? namespace : '');
      if (section) {
        subnodes.push(this.processingSection(section, types, nsType));
      }
    }
  } else {
    let sections = this.metaRepo.getNavigationSections(namespace !== this.GLOBAL_NS ? namespace : '');
    for (let s in sections) {
      if (sections.hasOwnProperty(s)) {
        subnodes.push(this.processingSection(sections[s], types, nsType));
      }
    }
  }

  if (this.skipSinglesSubnodes && subnodes.length === 1) {
    subnodes = subnodes[0].nodes;
  } else {
    orderMenu(subnodes);
  }

  return {
    id: namespace,
    nodes: subnodes,
    hint: namespaceTitle,
    caption: namespaceTitle,
    url: '',
    type: typeParser(nsType)
  };
};

MenuBuilder.prototype.processingSection = function (section, types, defaultType) {
  let secType = types && types.sections && types.sections.hasOwnProperty(section.name) &&
  types.sections[section.name].types ? types.sections[section.name].type : defaultType;
  let nodesTypes = types && types.sections && types.sections.hasOwnProperty(section.name) &&
  types.sections[section.name].nodes ? types.sections[section.name].nodes : {};
  return {
    id: section.name,
    nodes: this.processingNodes(section.nodes, nodesTypes, secType),
    hint: section.caption,
    caption: section.caption,
    url: null,
    itemType: section.itemType,
    orderNumber: section.orderNumber,
    type: typeParser(secType)
  };
};

MenuBuilder.prototype.processingNodes = function (nodes, types, defaultType) {
  let result = [];
  for (let i in nodes) {
    if (nodes.hasOwnProperty(i)) {
      let node = this.processingNode(nodes, types, defaultType);
      if (node) {
        if (Object.keys(nodes).length === 1 && node.nodes.length > 0) {
          return node.nodes;
        } else {
          result.push(node);
        }
      }
    }
  }
  orderMenu(result);
  return result;
};

MenuBuilder.prototype.processingNode = function (node, types, defaultType) {
  let nodeType = types.hasOwnProperty(node.code) && types[node.code].type ? types[node.code].type : defaultType;
  let subnodes = this.processingNodes(node.children,
    types.hasOwnProperty(node.code) && types[node.code].nodes ? types[node.code].nodes : {},
    nodeType);
  let aclId = nodeAclId(node);
  let external = false;
  let url;
  switch (node.type) {
    case NodeTypes.GROUP: {
      url = '';
    } break;
    case NodeTypes.HYPERLINK: {
      url = node.url;
      external = node.external || false;
    } break;
    default: {
      url = '/' + this.moduleName + '/' + (node.namespace ? node.namespace + '@' : '') + node.code;
      if (Array.isArray(this.aclResources)) {
        if (this.aclResources.indexOf(aclId) < 0) {
          this.aclResources.push(aclId);
        }
      }
    } break;
  }

  return {
    id: node.code,
    nodes: subnodes,
    hint: node.hint,
    caption: node.caption,
    url: url,
    external: external,
    orderNumber: node.orderNumber,
    type: typeParser(nodeType),
    aclId: aclId
  };
};

module.exports.MenuBuilder = MenuBuilder;
