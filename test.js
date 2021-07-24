/**
 * @typedef {import('unist').Literal<string>} Literal
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Parent} Parent
 */

import assert from 'assert'
import test from 'tape'
import remark from 'remark'
import gfm from 'remark-gfm'
import {visit, CONTINUE, EXIT, SKIP} from './index.js'

const tree = remark().parse('Some _emphasis_, **importance**, and `code`.')

const stopIndex = 5
const skipIndex = 7
const skipReverseIndex = 6

const texts = 6
const codes = 1

const types = [
  'root',
  'paragraph',
  'text',
  'emphasis',
  'text',
  'text',
  'strong',
  'text',
  'text',
  'inlineCode',
  'text'
]

const reverseTypes = [
  'root',
  'paragraph',
  'text',
  'inlineCode',
  'text',
  'strong',
  'text',
  'text',
  'emphasis',
  'text',
  'text'
]

test('unist-util-visit', (t) => {
  t.throws(
    () => {
      // @ts-ignore runtime.
      visit()
    },
    /TypeError: visitor is not a function/,
    'should fail without tree'
  )

  t.throws(
    () => {
      // @ts-ignore runtime.
      visit(tree)
    },
    /TypeError: visitor is not a function/,
    'should fail without visitor'
  )

  t.test('should iterate over all nodes', (t) => {
    let n = 0

    visit(tree, visitor)

    t.equal(n, types.length, 'should visit all nodes')

    t.end()

    /**
     * @param {Node} node
     */
    function visitor(node) {
      assert.strictEqual(node.type, types[n], 'should be the expected type')
      n++
    }
  })

  t.test('should iterate over all nodes, backwards', (t) => {
    let n = 0

    visit(tree, visitor, true)

    t.equal(n, reverseTypes.length, 'should visit all nodes in reverse')

    t.end()

    /**
     * @param {Node} node
     */
    function visitor(node) {
      assert.strictEqual(
        node.type,
        reverseTypes[n],
        'should be the expected type'
      )
      n++
    }
  })

  t.test('should only visit a given `type`', (t) => {
    let n = 0

    visit(tree, 'text', visitor)

    t.equal(n, texts, 'should visit all matching nodes')

    t.end()

    /**
     * @param {Node} node
     */
    function visitor(node) {
      assert.strictEqual(node.type, 'text', 'should be the expected type')
      n++
    }
  })

  t.test('should only visit given `type`s', (t) => {
    const types = ['text', 'inlineCode']
    let n = 0

    visit(tree, types, visitor)

    t.equal(n, texts + codes, 'should visit all matching nodes')

    t.end()

    /**
     * @param {Node} node
     */
    function visitor(node) {
      n++
      assert.notStrictEqual(types.indexOf(node.type), -1, 'should match')
    }
  })

  t.test('should accept any `is`-compatible test function', (t) => {
    let n = 0

    visit(tree, test, visitor)

    t.equal(n, 3, 'should visit all passing nodes')

    t.end()

    /**
     * @param {Node} node
     * @param {number|null} index
     * @param {Parent|null} parent
     */
    function visitor(node, index, parent) {
      const info = '(' + (parent && parent.type) + ':' + index + ')'
      assert.ok(test(node, index), 'should be a requested node ' + info)
      n++
    }

    /**
     * @param {Node} _
     * @param {number|null} index
     */
    function test(_, index) {
      return index > 3
    }
  })

  t.test('should accept an array of `is`-compatible tests', (t) => {
    const expected = new Set(['root', 'paragraph', 'emphasis', 'strong'])
    const tests = [test, 'paragraph', {value: '.'}, 'emphasis', 'strong']
    let n = 0

    visit(tree, tests, visitor)

    t.equal(n, 5, 'should visit all passing nodes')

    t.end()

    /**
     * @param {Literal} node
     */
    function visitor(node) {
      const ok = expected.has(node.type) || node.value === '.'
      assert.ok(ok, 'should be a requested type: ' + node.type)
      n++
    }

    /**
     * @param {Node} node
     */
    function test(node) {
      return node.type === 'root'
    }
  })

  t.test('should stop if `visitor` stops', (t) => {
    let n = 0

    visit(tree, visitor)

    t.equal(n, stopIndex, 'should visit nodes until `EXIT` is given')

    t.end()

    /**
     * @param {Node} node
     */
    function visitor(node) {
      assert.strictEqual(node.type, types[n++], 'should be the expected type')
      return n === stopIndex ? EXIT : CONTINUE
    }
  })

  t.test('should stop if `visitor` stops, backwards', (t) => {
    let n = 0

    visit(tree, visitor, true)

    t.equal(n, stopIndex, 'should visit nodes until `EXIT` is given')

    t.end()

    /**
     * @param {Node} node
     */
    function visitor(node) {
      assert.strictEqual(
        node.type,
        reverseTypes[n++],
        'should be the expected type'
      )
      return n === stopIndex ? EXIT : CONTINUE
    }
  })

  t.test('should skip if `visitor` skips', (t) => {
    let n = 0
    let count = 0

    visit(tree, visitor)

    t.equal(
      count,
      types.length - 1,
      'should visit nodes except when `SKIP` is given'
    )

    t.end()

    /**
     * @param {Node} node
     */
    function visitor(node) {
      assert.strictEqual(node.type, types[n++], 'should be the expected type')
      count++

      if (n === skipIndex) {
        n++ // The one node inside it.
        return SKIP
      }
    }
  })

  t.test('should skip if `visitor` skips, backwards', (t) => {
    let n = 0
    let count = 0

    visit(tree, visitor, true)

    t.equal(
      count,
      reverseTypes.length - 1,
      'should visit nodes except when `SKIP` is given'
    )

    t.end()

    /**
     * @param {Node} node
     */
    function visitor(node) {
      assert.strictEqual(
        node.type,
        reverseTypes[n++],
        'should be the expected type'
      )
      count++

      if (n === skipReverseIndex) {
        n++ // The one node inside it.
        return SKIP
      }
    }
  })

  t.test(
    'should support a given `index` to iterate over next (`0` to reiterate)',
    (t) => {
      let n = 0
      let again = false
      const expected = [
        'root',
        'paragraph',
        'text',
        'emphasis',
        'text',
        'text',
        'strong',
        'text',
        'text', // Again.
        'emphasis',
        'text',
        'text',
        'strong',
        'text',
        'text',
        'inlineCode',
        'text'
      ]

      visit(tree, visitor)

      t.equal(n, expected.length, 'should visit nodes again')

      t.end()

      /**
       * @param {Node} node
       */
      function visitor(node) {
        assert.strictEqual(
          node.type,
          expected[n++],
          'should be the expected type'
        )

        if (again === false && node.type === 'strong') {
          again = true
          return 0 // Start over.
        }
      }
    }
  )

  t.test(
    'should support a given `index` to iterate over next (`children.length` to skip further children)',
    (t) => {
      let n = 0
      let again = false
      const expected = [
        'root',
        'paragraph',
        'text',
        'emphasis',
        'text',
        'text',
        'strong', // Skip here
        'text'
      ]

      visit(tree, visitor)

      t.equal(n, expected.length, 'should skip nodes')

      t.end()

      /**
       * @param {Node} node
       * @param {number|null} _
       * @param {Parent|null} parent
       */
      function visitor(node, _, parent) {
        assert.strictEqual(
          node.type,
          expected[n++],
          'should be the expected type'
        )

        if (again === false && node.type === 'strong') {
          again = true
          return parent.children.length // Skip siblings.
        }
      }
    }
  )

  t.test('should support any other given `index` to iterate over next', (t) => {
    let n = 0
    let again = false
    const expected = [
      'root',
      'paragraph',
      'text',
      'emphasis',
      'text',
      'text',
      'strong',
      'text',
      'inlineCode', // Skip to here.
      'text'
    ]

    visit(tree, visitor)

    t.equal(n, expected.length, 'should skip nodes')

    t.end()

    /**
     * @param {Node} node
     * @param {number|null} index
     */
    function visitor(node, index) {
      assert.strictEqual(
        node.type,
        expected[n++],
        'should be the expected type'
      )

      if (again === false && node.type === 'strong') {
        again = true
        return index + 2 // Skip to `inlineCode`.
      }
    }
  })

  t.test('should visit added nodes', (t) => {
    const tree = remark().parse('Some _emphasis_, **importance**, and `code`.')

    // Unified doesn't know parse result type,
    // all we know is that it's a node, but we know it is a parent, so we
    // assert that here
    const other = /** @type{Parent} */ (
      remark().use(gfm).parse('Another ~~sentence~~.')
    ).children[0]

    const l = types.length + 5 // (p, text, delete, text, text)
    let n = 0

    visit(tree, visitor)

    t.equal(n, l, 'should walk over all nodes')

    t.end()

    /**
     * @param {Node} _1
     * @param {number|null} _2
     * @param {Parent|null} parent
     */
    function visitor(_1, _2, parent) {
      n++

      if (n === 2) {
        parent.children.push(other)
      }
    }
  })

  t.end()
})
