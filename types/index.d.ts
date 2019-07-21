// TypeScript Version: 3.5

import {Node, Parent} from 'unist'

interface Visitor<V extends Node> {
  (node: V, index: number, parent: Node): void
}

/**
 * Check that type property matches expectation for a node
 *
 * @typeParam T type of node that passes test
 */
type TestType<T extends Node> = T['type']

/**
 * Check that some attributes on a node are matched
 *
 * @typeParam T type of node that passes test
 */
type TestObject<T extends Node> = Partial<T>

/**
 * Check if a node passes a test
 *
 * @typeParam T type of node that passes test
 */
interface TestFunction<T extends Node> {
  /**
   * Check if a node passes a test
   *
   * @param node node to check
   * @param index index of node in parent
   * @param parent parent of node
   */
  (node: Node, index?: number, parent?: Parent): node is T
}

/**
 * Union of all the types of tests
 *
 * @typeParam T type of node that passes test
 */
type Test<T extends Node> = TestType<T> | TestObject<T> | TestFunction<T>

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
  test: Test<V>,
  visitor: Visitor<V>,
  reverse?: boolean
): void

/**
 * Visit children of tree which pass one of the tests
 *
 * @param tree abstract syntax tree to visit
 * @param test test node
 * @param visitor function to run for each node
 * @param reverse visit the tree in reverse, defaults to false
 * @typeParam T tree node
 * @typeParam V node type to visit
 */
declare function visit(
  tree: Node,
  test: Array<Test<any>>,
  visitor: Visitor<Node>,
  reverse?: boolean
): void

/**
 * Visit children of a tree
 *
 * @param tree abstract syntax tree to visit
 * @param visitor function to run for each node
 * @param reverse visit the tree in reverse, defaults to false
 * @typeParam T tree node
 */
declare function visit(
  tree: Node,
  visitor: Visitor<Node>,
  reverse?: boolean
): void

export = visit
