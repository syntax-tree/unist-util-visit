/* eslint-disable @typescript-eslint/no-confusing-void-expression, @typescript-eslint/no-empty-function */

import {expectError} from 'tsd'
import {Node, Parent} from 'unist'
import {visit, SKIP, EXIT, CONTINUE} from './index.js'

/* Setup */
const sampleTree = {
  type: 'root',
  children: [{type: 'heading', depth: 1, children: []}]
}

interface Heading extends Parent {
  type: 'heading'
  depth: number
  children: Node[]
}

interface Element extends Parent {
  type: 'element'
  tagName: string
  properties: Record<string, unknown>
  content: Node
  children: Node[]
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
visit(sampleTree, (_) => {})
visit(sampleTree, (_: Node) => {})
expectError(visit(sampleTree, (_: Element) => {}))
expectError(visit(sampleTree, (_: Heading) => {}))

/* Visit with type test. */
visit(sampleTree, 'heading', (_) => {})
visit(sampleTree, 'heading', (_: Heading) => {})
expectError(visit(sampleTree, 'not-a-heading', (_: Heading) => {}))
expectError(visit(sampleTree, 'element', (_: Heading) => {}))

visit(sampleTree, 'element', (_) => {})
visit(sampleTree, 'element', (_: Element) => {})
expectError(visit(sampleTree, 'not-an-element', (_: Element) => {}))
expectError(visit(sampleTree, 'heading', (_: Element) => {}))

/* Visit with object test. */
visit(sampleTree, {type: 'heading'}, (_) => {})
visit(sampleTree, {random: 'property'}, (_) => {})

visit(sampleTree, {type: 'heading'}, (_: Heading) => {})
visit(sampleTree, {type: 'heading', depth: 2}, (_: Heading) => {})
expectError(visit(sampleTree, {type: 'element'}, (_: Heading) => {}))
expectError(
  visit(sampleTree, {type: 'heading', depth: '2'}, (_: Heading) => {})
)

visit(sampleTree, {type: 'element'}, (_: Element) => {})
visit(sampleTree, {type: 'element', tagName: 'section'}, (_: Element) => {})

expectError(visit(sampleTree, {type: 'heading'}, (_: Element) => {}))

expectError(
  visit(sampleTree, {type: 'element', tagName: true}, (_: Element) => {})
)

/* Visit with function test. */
visit(sampleTree, headingTest, (_) => {})
visit(sampleTree, headingTest, (_: Heading) => {})
expectError(visit(sampleTree, headingTest, (_: Element) => {}))

visit(sampleTree, elementTest, (_) => {})
visit(sampleTree, elementTest, (_: Element) => {})
expectError(visit(sampleTree, elementTest, (_: Heading) => {}))

/* Visit with array of tests. */
visit(sampleTree, ['ParagraphNode', {type: 'element'}, headingTest], (_) => {})

/* Visit returns action. */
visit(sampleTree, 'heading', (_) => CONTINUE)
visit(sampleTree, 'heading', (_) => EXIT)
visit(sampleTree, 'heading', (_) => SKIP)
expectError(visit(sampleTree, 'heading', (_) => 'random'))

/* Visit returns index. */
visit(sampleTree, 'heading', (_) => 0)
visit(sampleTree, 'heading', (_) => 1)

/* Visit returns tuple. */
visit(sampleTree, 'heading', (_) => [CONTINUE, 1])
visit(sampleTree, 'heading', (_) => [EXIT, 1])
visit(sampleTree, 'heading', (_) => [SKIP, 1])
visit(sampleTree, 'heading', (_) => [SKIP])
expectError(visit(sampleTree, 'heading', (_) => [1]))
expectError(visit(sampleTree, 'heading', (_) => ['random', 1]))
