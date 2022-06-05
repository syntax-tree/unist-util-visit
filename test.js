/**
 * @typedef {import('unist').Literal<string>} Literal
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Parent} Parent
 */

import assert from 'node:assert'
import test from 'tape'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {gfmFromMarkdown} from 'mdast-util-gfm'
import {gfm} from 'micromark-extension-gfm'
import {visit, CONTINUE, EXIT, SKIP} from './index.js'

const tree = fromMarkdown('Some _emphasis_, **importance**, and `code`.')

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
      // @ts-expect-error runtime.
      visit()
    },
    /TypeError: visitor is not a function/,
    'should fail without tree'
  )

  t.throws(
    () => {
      // @ts-expect-error runtime.
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

    visit(tree, test, (node, index, parent) => {
      const info = '(' + (parent && parent.type) + ':' + index + ')'
      assert.ok(test(node, index), 'should be a requested node ' + info)
      n++
    })

    t.equal(n, 3, 'should visit all passing nodes')

    t.end()

    /**
     * @param {Node} _
     * @param {number|null|undefined} index
     */
    function test(_, index) {
      return typeof index === 'number' && index > 3
    }
  })

  t.test('should accept an array of `is`-compatible tests', (t) => {
    const expected = new Set(['root', 'paragraph', 'emphasis', 'strong'])
    const tests = [
      /** @param {Node} node */
      (node) => node.type === 'root',
      'paragraph',
      {value: '.'},
      'emphasis',
      'strong'
    ]
    let n = 0

    visit(tree, tests, (node) => {
      // @ts-expect-error: indexable.
      const ok = expected.has(node.type) || node.value === '.'
      assert.ok(ok, 'should be a requested type: ' + node.type)
      n++
    })

    t.equal(n, 5, 'should visit all passing nodes')

    t.end()
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

        if (parent && again === false && node.type === 'strong') {
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

      if (
        typeof index === 'number' &&
        again === false &&
        node.type === 'strong'
      ) {
        again = true
        return index + 2 // Skip to `inlineCode`.
      }
    }
  })

  t.test('should visit added nodes', (t) => {
    const tree = fromMarkdown('Some _emphasis_, **importance**, and `code`.')
    const other = /** @type {Parent} */ (
      fromMarkdown('Another ~~sentence~~.', {
        extensions: [gfm()],
        mdastExtensions: [gfmFromMarkdown()]
      }).children[0]
    )

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

      if (parent && n === 2) {
        parent.children.push(other)
      }
    }
  })

  t.end()
})
