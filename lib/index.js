/**
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Parent} Parent
 * @typedef {import('unist-util-is').Test} Test
 * @typedef {import('unist-util-visit-parents').VisitorResult} VisitorResult
 */

/**
 * Check if `Child` can be a child of `Ancestor`.
 *
 * Returns the ancestor when `Child` can be a child of `Ancestor`, or returns
 * `never`.
 *
 * @template {Node} Ancestor
 *   Node type.
 * @template {Node} Child
 *   Node type.
 * @typedef {(
 *   Ancestor extends Parent
 *     ? Child extends Ancestor['children'][number]
 *       ? Ancestor
 *       : never
 *     : never
 * )} ParentsOf
 */

/**
 * @template {Node} [Visited=Node]
 *   Visited node type.
 * @template {Parent} [Ancestor=Parent]
 *   Ancestor type.
 * @callback Visitor
 *   Handle a node (matching `test`, if given).
 *
 *   Visitors are free to transform `node`.
 *   They can also transform `parent`.
 *
 *   Replacing `node` itself, if `SKIP` is not returned, still causes its
 *   descendants to be walked (which is a bug).
 *
 *   When adding or removing previous siblings of `node` (or next siblings, in
 *   case of reverse), the `Visitor` should return a new `Index` to specify the
 *   sibling to traverse after `node` is traversed.
 *   Adding or removing next siblings of `node` (or previous siblings, in case
 *   of reverse) is handled as expected without needing to return a new `Index`.
 *
 *   Removing the children property of `parent` still results in them being
 *   traversed.
 * @param {Visited} node
 *   Found node.
 * @param {Visited extends Node ? number | null : never} index
 *   Index of `node` in `parent`.
 * @param {Ancestor extends Node ? Ancestor | null : never} parent
 *   Parent of `node`.
 * @returns {VisitorResult}
 *   What to do next.
 *
 *   An `Index` is treated as a tuple of `[CONTINUE, Index]`.
 *   An `Action` is treated as a tuple of `[Action]`.
 *
 *   Passing a tuple back only makes sense if the `Action` is `SKIP`.
 *   When the `Action` is `EXIT`, that action can be returned.
 *   When the `Action` is `CONTINUE`, `Index` can be returned.
 */

/**
 * Build a typed `Visitor` function from a node and all possible parents.
 *
 * It will infer which values are passed as `node` and which as `parent`.
 *
 * @template {Node} Visited
 *   Node type.
 * @template {Parent} Ancestor
 *   Parent type.
 * @typedef {Visitor<Visited, ParentsOf<Ancestor, Visited>>} BuildVisitorFromMatch
 */

/**
 * Build a typed `Visitor` function from a list of descendants and a test.
 *
 * It will infer which values are passed as `node` and which as `parent`.
 *
 * @template {Node} Descendant
 *   Node type.
 * @template {Test} Check
 *   Test type.
 * @typedef {(
 *   BuildVisitorFromMatch<
 *     import('unist-util-visit-parents/complex-types.js').Matches<Descendant, Check>,
 *     Extract<Descendant, Parent>
 *   >
 * )} BuildVisitorFromDescendants
 */

/**
 * Build a typed `Visitor` function from a tree and a test.
 *
 * It will infer which values are passed as `node` and which as `parent`.
 *
 * @template {Node} [Tree=Node]
 *   Node type.
 * @template {Test} [Check=string]
 *   Test type.
 * @typedef {(
 *   BuildVisitorFromDescendants<
 *     import('unist-util-visit-parents/complex-types.js').InclusiveDescendant<Tree>,
 *     Check
 *   >
 * )} BuildVisitor
 */

import {visitParents} from 'unist-util-visit-parents'

/**
 * Visit children of tree which pass test.
 *
 * @param tree
 *   Tree to walk
 * @param [test]
 *   `unist-util-is`-compatible test
 * @param visitor
 *   Function called for nodes that pass `test`.
 * @param reverse
 *   Traverse in reverse preorder (NRL) instead of preorder (NLR) (default).
 */
export const visit =
  /**
   * @type {(
   *   (<Tree extends Node, Check extends Test>(tree: Tree, test: Check, visitor: BuildVisitor<Tree, Check>, reverse?: boolean) => void) &
   *   (<Tree extends Node>(tree: Tree, visitor: BuildVisitor<Tree>, reverse?: boolean) => void)
   * )}
   */
  (
    /**
     * @param {Node} tree
     * @param {Test} test
     * @param {Visitor} visitor
     * @param {boolean} [reverse]
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
       * @param {Array<Parent>} parents
       */
      function overload(node, parents) {
        const parent = parents[parents.length - 1]
        return visitor(
          node,
          parent ? parent.children.indexOf(node) : null,
          parent
        )
      }
    }
  )

export {CONTINUE, EXIT, SKIP} from 'unist-util-visit-parents'
