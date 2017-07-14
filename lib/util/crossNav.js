/**
 * Created by krasilneg on 13.07.17.
 */

/**
 * @param {Array} nodes
 * @param {MetaRepository} metaRepo
 */
function parseNodes(nodes) {
  let result = [];
  nodes.forEach((n)=>{
    if (n.type === 0) {
      result.push({
        caption: n.caption,
        hint: n.hint,
        subnodes: parseNodes(n.children)
      });
    } else if (n.type === 3) {
      result.push({
        id: 'node_' + n.code,
        caption: n.caption,
        hint: n.hint,
        url: n.url,
        external: n.external
      });
    }
  });
  return result;
}


/**
 * @param {String} module
 * @param {MetaRepository} metaRepo
 * @param {SettingsRepository} settings
 */
module.exports = function (module, metaRepo, settings) {
  let sections = settings.get(module + '.crossNav');
  let result = [];
  if (Array.isArray(sections)) {
    sections.forEach((s)=>{
      let section = metaRepo.getNavigationSection(s);
      if (section) {
        let nodes = metaRepo.getNodes(s);
        if (nodes.length) {
          let node = {
            id: 'sect_' + section.name,
            caption: section.caption,
            subnodes: parseNodes(nodes)
          };
          result.push(node);
        }
      }
    });
  }
  return result;
};
