/**
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Parent} Parent
 * @typedef {import('unist-util-is').Type} Type
 * @typedef {import('unist-util-is').Props} Props
 * @typedef {import('unist-util-is').TestFunctionAnything} TestFunctionAnything
 * @typedef {import('unist-util-visit-parents').Action} Action
 * @typedef {import('unist-util-visit-parents').Index} Index
 * @typedef {import('unist-util-visit-parents').ActionTuple} ActionTuple
 */

/**
 * Invoked when a node (matching test, if given) is found.
 * Visitors are free to transform node.
 * They can also transform the parent of node (the last of ancestors).
 * Replacing node itself, if `SKIP` is not returned, still causes its descendants to be visited.
 * If adding or removing previous siblings (or next siblings, in case of reverse) of node,
 * visitor should return a new index (number) to specify the sibling to traverse after node is traversed.
 * Adding or removing next siblings of node (or previous siblings, in case of reverse)
 * is handled as expected without needing to return a new index.
 * Removing the children property of an ancestor still results in them being traversed.
 *
 * @template {Node} V
 * @callback Visitor
 * @param {V} node Found node
 * @param {number|null} index Position of `node` in `parent`
 * @param {Parent|null} parent Parent of `node`
 * @returns {null|undefined|Action|Index|ActionTuple|void}
 */

import {visitParents, CONTINUE, SKIP, EXIT} from 'unist-util-visit-parents'

export {CONTINUE, SKIP, EXIT}

export const visit =
  /**
   * @type {(
   *   (<T extends Node>(tree: Node, test: T['type']|Partial<T>|import('unist-util-is').TestFunctionPredicate<T>|Array.<T['type']|Partial<T>|import('unist-util-is').TestFunctionPredicate<T>>, visitor: Visitor<T>, reverse?: boolean) => void) &
   *   ((tree: Node, test: null|undefined|Type|Props|TestFunctionAnything|Array<Type|Props|TestFunctionAnything>, visitor: Visitor<Node>, reverse?: boolean) => void) &
   *   ((tree: Node, visitor: Visitor<Node>, reverse?: boolean) => void)
   * )}
   */
  (
    /**
     * Visit children of tree which pass a test
     *
     * @param {Node} tree Abstract syntax tree to walk
     * @param {null|undefined|Type|Props|TestFunctionAnything|Array<Type|Props|TestFunctionAnything>} test test Test node
     * @param {Visitor<Node>} visitor Function to run for each node
     * @param {boolean} [reverse] Fisit the tree in reverse, defaults to false
     */
    function (tree, test, visitor, reverse) {
      if (typeof test === 'function' && typeof visitor !== 'function') {
        reverse = visitor
        visitor = test
        test = null
      }

      visitParents(tree, test, overload, reverse)

      /**
       * @param {Node} node
       * @param {Array.<Parent>} parents
       */
      function overload(node, parents) {
        var parent = parents[parents.length - 1]
        return visitor(
          node,
          parent ? parent.children.indexOf(node) : null,
          parent
        )
      }
    }
  )
