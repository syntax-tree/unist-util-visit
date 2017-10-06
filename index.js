'use strict';

/* Expose. */
module.exports = visit;

/* Regular expression special characters
 * http://ecma-international.org/ecma-262/7.0/#prod-SyntaxCharacter
 */
var reSpecial = /[\\^$.*+?()[\]{}|]/g;

/* Visit. */
function visit(tree, type, visitor, reverse) {
  var matchType;

  if (typeof type === 'function') {
    reverse = visitor;
    visitor = type;
    type = null;
  } else if (type) {
    if (!Array.isArray(type)) {
      type = [type];
    }
    matchType = type.map(function (type) {
      return '^' + type.replace(reSpecial, '\\$&') + '$';
    });
    matchType = new RegExp(matchType.join('|'));
  }

  one(tree);

  /* Visit a single node. */
  function one(node, index, parent) {
    var result;

    index = index || (parent ? 0 : null);

    if (!type || matchType.test(node.type)) {
      result = visitor(node, index, parent || null);
    }

    if (node.children && result !== false) {
      return all(node.children, node);
    }

    return result;
  }

  /* Visit children in `parent`. */
  function all(children, parent) {
    var step = reverse ? -1 : 1;
    var max = children.length;
    var min = -1;
    var index = (reverse ? max : min) + step;
    var child;

    while (index > min && index < max) {
      child = children[index];

      if (child && one(child, index, parent) === false) {
        return false;
      }

      index += step;
    }

    return true;
  }
}
