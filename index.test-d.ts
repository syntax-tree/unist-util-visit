import {
  expectAssignable,
  expectNotAssignable,
  expectNotType,
  expectType
} from 'tsd'
import type {
  Blockquote,
  Definition,
  Delete,
  Emphasis,
  FootnoteDefinition,
  Heading,
  Link,
  LinkReference,
  ListItem,
  Nodes,
  Parents,
  PhrasingContent,
  Root,
  RootContent,
  Strong,
  TableCell,
  TableRow
} from 'mdast'
import type {Node, Parent} from 'unist'
import {
  type VisitorExit,
  type VisitorResultExit,
  CONTINUE,
  EXIT,
  SKIP,
  visit
} from './index.js'

// Setup.
const implicitTree = {
  type: 'root',
  children: [{type: 'heading', depth: 1, children: []}]
}

const sampleTree: Root = {
  type: 'root',
  children: [{type: 'heading', depth: 1, children: []}]
}

// ## Missing parameters
// @ts-expect-error: check that `node` is passed.
visit()
// @ts-expect-error: check that `visitor` is passed.
visit(sampleTree)

// ## No test
visit(sampleTree, function (node, index, parent) {
  expectType<Nodes>(node)
  expectType<number | undefined>(index)
  expectType<Parents | undefined>(parent)
})

visit(implicitTree, function (node, index, parent) {
  // Objects are too loose.
  expectAssignable<Node>(node)
  expectNotType<Node>(node)
  expectType<number | undefined>(index)
  expectAssignable<Parent | undefined>(parent)
})

// ## String test

// Knows it’s a heading and its parents.
visit(sampleTree, 'heading', function (node, index, parent) {
  expectType<Heading>(node)
  expectType<number | undefined>(index)
  expectType<Blockquote | FootnoteDefinition | ListItem | Root | undefined>(
    parent
  )
})

// Not in tree.
visit(sampleTree, 'element', function (node, index, parent) {
  expectType<never>(node)
  expectType<never>(index)
  expectType<never>(parent)
})

// Implicit nodes are too loose.
visit(implicitTree, 'heading', function (node, index, parent) {
  expectType<never>(node)
  expectType<never>(index)
  expectType<never>(parent)
})

visit(sampleTree, 'tableCell', function (node, index, parent) {
  expectType<TableCell>(node)
  expectType<number | undefined>(index)
  expectType<Root | TableRow | undefined>(parent)
})

// ## Visitors

// No test.
visit(sampleTree, {
  enter(node, index, parent) {
    expectType<Nodes>(node)
    expectType<number | undefined>(index)
    expectType<Parents | undefined>(parent)
  },
  exit(node, index, parent) {
    expectType<Nodes>(node)
    expectType<number | undefined>(index)
    expectType<Parents | undefined>(parent)
  }
})

// Only `exit`, reverse.
visit(
  sampleTree,
  {
    exit(node) {
      expectType<Nodes>(node)
    }
  },
  true
)

// String test.
visit(sampleTree, 'heading', {
  enter(node, index, parent) {
    expectType<Heading>(node)
    expectType<number | undefined>(index)
    expectType<Blockquote | FootnoteDefinition | ListItem | Root | undefined>(
      parent
    )
  },
  exit(node, index, parent) {
    expectType<Heading>(node)
    expectType<number | undefined>(index)
    expectType<Blockquote | FootnoteDefinition | ListItem | Root | undefined>(
      parent
    )
  }
})

// `exit` is required, to just `enter`, pass it directly.
// @ts-expect-error: check that `exit` is required.
visit(sampleTree, {})
// @ts-expect-error: check that `exit` is required.
visit(sampleTree, {enter: () => CONTINUE})
// @ts-expect-error: check that `exit` is required.
visit(sampleTree, 'heading', {enter: () => CONTINUE})

// Results.
visit(sampleTree, {
  enter() {
    return SKIP
  },
  exit() {
    return EXIT
  }
})

visit(sampleTree, {
  exit() {
    return 1
  }
})

visit(sampleTree, {
  // @ts-expect-error: check that `SKIP` cannot be returned from `exit`.
  exit() {
    return SKIP
  }
})

visit(sampleTree, {
  // @ts-expect-error: check that tuples cannot be returned from `exit`.
  exit() {
    return [CONTINUE, 1]
  }
})

// Exit visitors on their own.
const exitVisitor: VisitorExit<Nodes, Parents> = function () {
  return EXIT
}

visit(sampleTree, {exit: exitVisitor})

expectAssignable<VisitorResultExit>(EXIT)
expectNotAssignable<VisitorResultExit>(SKIP)

// ## Props test

// Knows that headings have depth, but TS doesn’t infer the depth normally.
visit(sampleTree, {depth: 1}, function (node) {
  expectType<Heading>(node)
  expectType<1 | 2 | 3 | 4 | 5 | 6>(node.depth)
})

// This goes fine.
visit(sampleTree, {type: 'heading'} as const, function (node) {
  expectType<Heading>(node)
  expectType<1 | 2 | 3 | 4 | 5 | 6>(node.depth)
})

// For some reason the const goes wrong.
visit(sampleTree, {depth: 1} as const, function (node) {
  // Note: something going wrong here, to do: investigate.
  expectType<never>(node)
})

// For some reason the const goes wrong.
visit(sampleTree, {type: 'heading', depth: 1} as const, function (node) {
  // Note: something going wrong here, to do: investigate.
  expectType<never>(node)
})

// Function test (implicit assertion).
visit(sampleTree, isHeadingLoose, function (node) {
  expectType<Nodes>(node)
})
// Function test (explicit assertion).
visit(sampleTree, isHeading, function (node) {
  expectType<Heading>(node)
  expectType<1 | 2 | 3 | 4 | 5 | 6>(node.depth)
})
// Function test (explicit assertion).
visit(sampleTree, isHeading2, function (node) {
  expectType<Heading & {depth: 2}>(node)
})

// ## Combined tests
visit(sampleTree, ['heading', {depth: 1}, isHeading], function (node) {
  // Unfortunately TS casts things in arrays too vague.
  expectType<Root | RootContent>(node)
})

// As const works.
visit(sampleTree, ['heading', {depth: 1}, isHeading] as const, function (node) {
  expectType<Heading>(node)
})

// ## Return type: incorrect.
// @ts-expect-error: not an action.
visit(sampleTree, function () {
  return 'random'
})
// @ts-expect-error: not a tuple: missing action.
visit(sampleTree, function () {
  return [1]
})
// @ts-expect-error: not a tuple: incorrect action.
visit(sampleTree, function () {
  return ['random', 1]
})

// ## Return type: action.
visit(sampleTree, function () {
  return CONTINUE
})
visit(sampleTree, function () {
  return EXIT
})
visit(sampleTree, function () {
  return SKIP
})

// ## Return type: index.
visit(sampleTree, function () {
  return 0
})
visit(sampleTree, function () {
  return 1
})

// ## Return type: tuple.
visit(sampleTree, function () {
  return [CONTINUE, 1]
})
visit(sampleTree, function () {
  return [EXIT, 1]
})
visit(sampleTree, function () {
  return [SKIP, 1]
})
visit(sampleTree, function () {
  return [SKIP]
})

// ## Infer on tree
visit(sampleTree, 'tableCell', function (node) {
  visit(node, function (node, _, parent) {
    expectType<TableCell | PhrasingContent>(node)
    expectType<
      Delete | Emphasis | Link | LinkReference | Strong | TableCell | undefined
    >(parent)
  })
})

visit(sampleTree, 'definition', function (node) {
  visit(node, function (node, _, parent) {
    expectType<Definition>(node)
    expectType<never>(parent)
  })
})

visit(sampleTree, ['definition'], function (node) {
  visit(node, function (node, _, parent) {
    expectNotType<Definition>(node)
    expectNotType<never>(parent)
  })
})

visit(sampleTree, ['definition'] as const, function (node) {
  visit(node, function (node, _, parent) {
    expectType<Definition>(node)
    expectType<never>(parent)
  })
})

function isHeading(node: Node): node is Heading {
  return node ? node.type === 'heading' : false
}

function isHeading2(node: Node): node is Heading & {depth: 2} {
  return isHeading(node) && node.depth === 2
}

function isHeadingLoose(node: Node) {
  return node ? node.type === 'heading' : false
}
