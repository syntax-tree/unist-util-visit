'use strict';

/* Expose. */
module.exports = visit;

visit.CONTINUE = true;
visit.SKIP = 'skip';
visit.EXIT = false;

var is = require('unist-util-is');

/* Visit. */
function visit(tree, test, visitor, reverse) {
  if (typeof test === 'function' && typeof visitor !== 'function') {
    reverse = visitor;
    visitor = test;
    test = null;
  }

  one(tree);

  /* Visit a single node. */
  function one(node, index, parent) {
    var result;

    index = index || (parent ? 0 : null);

    if (!test || node.type === test || is(test, node, index, parent || null)) {
      result = visitor(node, index, parent || null);
    }

    if (result === visit.EXIT) {
      return result;
    }

    if (node.children && result !== visit.SKIP) {
      return all(node.children, node);
    }

    return visit.CONTINUE;
  }

  /* Visit children in `parent`. */
  function all(children, parent) {
    var step = reverse ? -1 : 1;
    var max = children.length;
    var min = -1;
    var index = (reverse ? max : min) + step;
    var child;
    var result;

    while (index > min && index < max) {
      child = children[index];
      result = child && one(child, index, parent);

      if (result === visit.EXIT) {
        return result;
      }

      index += step;
    }

    return visit.CONTINUE;
  }
}
