/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('unist').Node} Node
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {gfmFromMarkdown} from 'mdast-util-gfm'
import {gfm} from 'micromark-extension-gfm'
import {CONTINUE, EXIT, SKIP, visit} from 'unist-util-visit'

// To do: remove cast after update.
const tree = /** @type {Root} */ (
  fromMarkdown('Some _emphasis_, **importance**, and `code`.')
)

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

test('visit', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('unist-util-visit')).sort(), [
      'CONTINUE',
      'EXIT',
      'SKIP',
      'visit'
    ])
  })

  await t.test('should fail without tree', async function () {
    assert.throws(function () {
      // @ts-expect-error: check that the runtime throws an error.
      visit()
    }, /TypeError: visitor is not a function/)
  })

  await t.test('should fail without visitor', async function () {
    assert.throws(function () {
      // @ts-expect-error: check that the runtime throws an error.
      visit(tree)
    }, /TypeError: visitor is not a function/)
  })

  await t.test('should iterate over all nodes', async function () {
    let n = 0

    visit(tree, function (node) {
      assert.strictEqual(node.type, types[n], 'should be the expected type')
      n++
    })

    assert.equal(n, types.length, 'should visit all nodes')
  })

  await t.test('should iterate over all nodes, backwards', async function () {
    let n = 0

    visit(
      tree,
      function (node) {
        assert.strictEqual(
          node.type,
          reverseTypes[n],
          'should be the expected type'
        )
        n++
      },
      true
    )

    assert.equal(n, reverseTypes.length, 'should visit all nodes in reverse')
  })

  await t.test('should only visit a given `type`', async function () {
    let n = 0

    visit(tree, 'text', function (node) {
      assert.strictEqual(node.type, 'text', 'should be the expected type')
      n++
    })

    assert.equal(n, texts, 'should visit all matching nodes')
  })

  await t.test('should only visit given `type`s', async function () {
    const types = ['text', 'inlineCode']
    let n = 0

    visit(tree, types, function (node) {
      n++
      assert.notStrictEqual(types.indexOf(node.type), -1, 'should match')
    })

    assert.equal(n, texts + codes, 'should visit all matching nodes')
  })

  await t.test(
    'should accept any `is`-compatible test function',
    async function () {
      let n = 0

      visit(
        tree,
        test,
        /**
         * @returns {undefined}
         */
        function (node, index, parent) {
          const info = '(' + (parent && parent.type) + ':' + index + ')'
          assert.ok(test(node, index), 'should be a requested node ' + info)
          n++
        }
      )

      assert.equal(n, 3, 'should visit all passing nodes')

      /**
       * @param {Node} _
       * @param {number | undefined} index
       */
      function test(_, index) {
        return typeof index === 'number' && index > 3
      }
    }
  )

  await t.test(
    'should accept an array of `is`-compatible tests',
    async function () {
      const expected = new Set(['root', 'paragraph', 'emphasis', 'strong'])
      let n = 0

      visit(
        tree,
        [
          function (node) {
            return node.type === 'root'
          },
          'paragraph',
          {value: '.'},
          'emphasis',
          'strong'
        ],
        function (node) {
          const ok =
            expected.has(node.type) || ('value' in node && node.value === '.')
          assert.ok(ok, 'should be a requested type: ' + node.type)
          n++
        }
      )

      assert.equal(n, 5, 'should visit all passing nodes')
    }
  )

  await t.test('should stop if `visitor` stops', async function () {
    let n = 0

    visit(tree, function (node) {
      assert.strictEqual(node.type, types[n++], 'should be the expected type')
      return n === stopIndex ? EXIT : CONTINUE
    })

    assert.equal(n, stopIndex, 'should visit nodes until `EXIT` is given')
  })

  await t.test('should stop if `visitor` stops, backwards', async function () {
    let n = 0

    visit(
      tree,
      function (node) {
        assert.strictEqual(
          node.type,
          reverseTypes[n++],
          'should be the expected type'
        )

        return n === stopIndex ? EXIT : CONTINUE
      },
      true
    )

    assert.equal(n, stopIndex, 'should visit nodes until `EXIT` is given')
  })

  await t.test('should skip if `visitor` skips', async function () {
    let n = 0
    let count = 0

    visit(tree, function (node) {
      assert.strictEqual(node.type, types[n++], 'should be the expected type')
      count++

      if (n === skipIndex) {
        n++ // The one node inside it.
        return SKIP
      }
    })

    assert.equal(
      count,
      types.length - 1,
      'should visit nodes except when `SKIP` is given'
    )
  })

  await t.test('should skip if `visitor` skips, backwards', async function () {
    let n = 0
    let count = 0

    visit(
      tree,
      function (node) {
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
      },
      true
    )

    assert.equal(
      count,
      reverseTypes.length - 1,
      'should visit nodes except when `SKIP` is given'
    )
  })

  await t.test(
    'should support a given `index` to iterate over next (`0` to reiterate)',
    async function () {
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

      visit(tree, function (node) {
        assert.strictEqual(
          node.type,
          expected[n++],
          'should be the expected type'
        )

        if (again === false && node.type === 'strong') {
          again = true
          return 0 // Start over.
        }
      })

      assert.equal(n, expected.length, 'should visit nodes again')
    }
  )

  await t.test(
    'should support a given `index` to iterate over next (`children.length` to skip further children)',
    async function () {
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

      visit(tree, function (node, _, parent) {
        assert.strictEqual(
          node.type,
          expected[n++],
          'should be the expected type'
        )

        if (parent && again === false && node.type === 'strong') {
          again = true
          return parent.children.length // Skip siblings.
        }
      })

      assert.equal(n, expected.length, 'should skip nodes')
    }
  )

  await t.test(
    'should support any other given `index` to iterate over next',
    async function () {
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

      visit(tree, function (node, index) {
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
      })

      assert.equal(n, expected.length, 'should skip nodes')
    }
  )

  await t.test('should visit added nodes', async function () {
    const tree = fromMarkdown('Some _emphasis_, **importance**, and `code`.')
    const other = fromMarkdown('Another ~~sentence~~.', {
      extensions: [gfm()],
      mdastExtensions: [gfmFromMarkdown()]
    }).children[0]

    const l = types.length + 5 // (p, text, delete, text, text)
    let n = 0

    visit(tree, function (_1, _2, parent) {
      n++

      if (parent && n === 2) {
        assert(parent.type === 'root')
        parent.children.push(other)
      }
    })

    assert.equal(n, l, 'should walk over all nodes')
  })
})
