'use strict'

module.exports = visit

var visitParents = require('unist-util-visit-parents')

visit.CONTINUE = visitParents.CONTINUE
visit.SKIP = visitParents.SKIP
visit.EXIT = visitParents.EXIT

function visit(tree, test, visitor, reverse) {
  if (typeof test === 'function' && typeof visitor !== 'function') {
    reverse = visitor
    visitor = test
    test = null
  }

  visitParents(tree, test, overload, reverse)

  function overload(node, parents) {
    var parent = parents[parents.length - 1]
    return visitor(node, parent ? parent.children.indexOf(node) : null, parent)
  }
}
