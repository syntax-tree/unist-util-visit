/* eslint-disable @typescript-eslint/no-empty-function */

import {expectError, expectType} from 'tsd'
import type {Node, Parent, Literal} from 'unist'
import {is} from 'unist-util-is'
import {visit, SKIP, EXIT, CONTINUE} from './index.js'

/* Setup */
const sampleTree: Root = {
  type: 'root',
  children: [{type: 'heading', depth: 1, children: []}]
}

const complexTree: Root = {
  type: 'root',
  children: [
    {
      type: 'blockquote',
      children: [{type: 'paragraph', children: [{type: 'text', value: 'a'}]}]
    },
    {
      type: 'paragraph',
      children: [
        {
          type: 'emphasis',
          children: [{type: 'emphasis', children: [{type: 'text', value: 'b'}]}]
        },
        {type: 'text', value: 'c'}
      ]
    }
  ]
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface Element extends Parent {
  type: 'element'
  tagName: string
  properties: Record<string, unknown>
  content: Node
  children: Array<Node>
}

type Content = Flow | Phrasing

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface Root extends Parent {
  type: 'root'
  children: Array<Flow>
}

type Flow = Blockquote | Heading | Paragraph

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface Blockquote extends Parent {
  type: 'blockquote'
  children: Array<Flow>
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface Heading extends Parent {
  type: 'heading'
  depth: number
  children: Array<Phrasing>
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface Paragraph extends Parent {
  type: 'paragraph'
  children: Array<Phrasing>
}

type Phrasing = Text | Emphasis

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface Emphasis extends Parent {
  type: 'emphasis'
  children: Array<Phrasing>
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface Text extends Literal {
  type: 'text'
  value: string
}

const isNode = (node: unknown): node is Node =>
  typeof node === 'object' && node !== null && 'type' in node
const headingTest = (node: unknown): node is Heading =>
  isNode(node) && node.type === 'heading'
const elementTest = (node: unknown): node is Element =>
  isNode(node) && node.type === 'element'

/* Missing params. */
expectError(visit())
expectError(visit(sampleTree))

/* Visit without test. */
visit(sampleTree, (node, _, parent) => {
  expectType<Root | Content>(node)
  expectType<Extract<Root | Content, Parent> | null>(parent)
})

/* Visit with type test. */
visit(sampleTree, 'heading', (node, _, parent) => {
  expectType<Heading>(node)
  expectType<Root | Blockquote | null>(parent)
})
visit(sampleTree, 'element', (node, index, parent) => {
  // Not in tree.
  expectType<never>(node)
  expectType<never>(index)
  expectType<never>(parent)
})
expectError(visit(sampleTree, 'heading', (_: Element) => {}))

/* Visit with object test. */
visit(sampleTree, {depth: 1}, (node) => {
  expectType<Heading>(node)
})
visit(sampleTree, {random: 'property'}, (node) => {
  expectType<never>(node)
})
visit(sampleTree, {type: 'heading', depth: '2'}, (node) => {
  // Not in tree.
  expectType<never>(node)
})
visit(sampleTree, {tagName: 'section'}, (node) => {
  // Not in tree.
  expectType<never>(node)
})
visit(sampleTree, {type: 'element', tagName: 'section'}, (node) => {
  // Not in tree.
  expectType<never>(node)
})

/* Visit with function test. */
visit(sampleTree, headingTest, (node) => {
  expectType<Heading>(node)
})
expectError(visit(sampleTree, headingTest, (_: Element) => {}))
visit(sampleTree, elementTest, (node) => {
  // Not in tree.
  expectType<never>(node)
})

/* Visit with array of tests. */
visit(sampleTree, ['heading', {depth: 1}, headingTest], (node) => {
  // Unfortunately TS casts things in arrays too vague.
  expectType<Root | Content>(node)
})

/* Visit returns action. */
visit(sampleTree, () => CONTINUE)
visit(sampleTree, () => EXIT)
visit(sampleTree, () => SKIP)
expectError(visit(sampleTree, () => 'random'))

/* Visit returns index. */
visit(sampleTree, () => 0)
visit(sampleTree, () => 1)

/* Visit returns tuple. */
visit(sampleTree, () => [CONTINUE, 1])
visit(sampleTree, () => [EXIT, 1])
visit(sampleTree, () => [SKIP, 1])
visit(sampleTree, () => [SKIP])
expectError(visit(sampleTree, () => [1]))
expectError(visit(sampleTree, () => ['random', 1]))

/* Should infer children from the given tree. */
visit(complexTree, (node, _, parent) => {
  expectType<Root | Content>(node)
  expectType<Extract<Root | Content, Parent> | null>(parent)
})

const blockquote = complexTree.children[0]
if (is<Blockquote>(blockquote, 'blockquote')) {
  visit(blockquote, (node, _, parent) => {
    expectType<Content>(node)
    expectType<Extract<Content, Parent> | null>(parent)
  })
}

const paragraph = complexTree.children[1]
if (is<Paragraph>(paragraph, 'paragraph')) {
  visit(paragraph, (node, _, parent) => {
    expectType<Paragraph | Phrasing>(node)
    expectType<Paragraph | Emphasis | null>(parent)
  })

  const child = paragraph.children[1]

  if (is<Emphasis>(child, 'emphasis')) {
    visit(child, 'blockquote', (node, index, parent) => {
      // `blockquote` does not exist in phrasing.
      expectType<never>(node)
      expectType<never>(index)
      expectType<never>(parent)
    })
  }
}
