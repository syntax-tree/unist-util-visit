// TypeScript Version: 3.5

import {Node, Parent} from 'unist'
import {Test} from 'unist-util-is'

interface Visitor<V extends Node> {
  (node: V, index: number, parent: Node): void
}

/**
 * Visit children of tree which pass a test
 *
 * @param tree abstract syntax tree to visit
 * @param test test node
 * @param visitor function to run for each node
 * @param reverse visit the tree in reverse, defaults to false
 * @typeParam T tree node
 * @typeParam V node type to visit
 */
declare function visit<V extends Node>(
  tree: Node,
  test: Test<V> | Array<Test<any>>,
  visitor: Visitor<V>,
  reverse?: boolean
): void

/**
 * Visit children of a tree
 *
 * @param tree abstract syntax tree to visit
 * @param visitor function to run for each node
 * @param reverse visit the tree in reverse, defaults to false
 */
declare function visit(
  tree: Node,
  visitor: Visitor<Node>,
  reverse?: boolean
): void

export = visit
