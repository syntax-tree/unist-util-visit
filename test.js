/**
 * @import {Root} from 'mdast'
 * @import {Node, Parent} from 'unist'
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {gfmFromMarkdown} from 'mdast-util-gfm'
import {gfm} from 'micromark-extension-gfm'
import {CONTINUE, EXIT, SKIP, visit} from 'unist-util-visit'

const mini = fromMarkdown('*a* b')
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
    }, /Unexpected value `undefined` for `tree`, expected node/)
  })

  await t.test('should fail without visitor', async function () {
    assert.throws(function () {
      // @ts-expect-error: check that the runtime throws an error.
      visit(tree)
    }, /Unexpected value `undefined` for `enter` or `visitors`/)
  })

  await t.test('should fail with a non-visitor `enter`', async function () {
    assert.throws(function () {
      // @ts-expect-error: check that the runtime throws an error.
      visit(tree, {enter: 1, exit() {}})
    }, /Unexpected value `1` for `visitors.enter`, expected optional visitor/)
  })

  await t.test('should fail with only `enter`', async function () {
    assert.throws(function () {
      // @ts-expect-error: check that the runtime throws an error.
      visit(tree, {enter() {}})
    }, /Unexpected value `undefined` for `visitors.exit`, expected visitor/)
  })

  await t.test('should support `enter` and `exit`', async function () {
    /** @type {Array<string>} */
    const events = []

    visit(mini, {
      enter(node, index, parent) {
        events.push(
          '+' + node.type + ':' + index + ':' + (parent && parent.type)
        )
      },
      exit(node, index, parent) {
        events.push(
          '-' + node.type + ':' + index + ':' + (parent && parent.type)
        )
      }
    })

    assert.equal(
      events.join(' '),
      '+root:undefined:undefined +paragraph:0:root +emphasis:0:paragraph +text:0:emphasis -text:0:emphasis -emphasis:0:paragraph +text:1:paragraph -text:1:paragraph -paragraph:0:root -root:undefined:undefined'
    )
  })

  await t.test('should support only `exit`', async function () {
    /** @type {Array<string>} */
    const events = []

    visit(mini, {
      exit(node) {
        events.push('-' + node.type)
      }
    })

    assert.equal(events.join(' '), '-text -emphasis -text -paragraph -root')
  })

  await t.test('should support a test and `reverse`', async function () {
    /** @type {Array<string>} */
    const events = []

    visit(
      mini,
      'text',
      {
        enter(node, index) {
          events.push('+' + node.value + ':' + index)
        },
        exit(node, index) {
          events.push('-' + node.value + ':' + index)
        }
      },
      true
    )

    assert.equal(events.join(' '), '+ b:1 - b:1 +a:0 -a:0')
  })

  await t.test('should support an `Index` from `exit`', async function () {
    const tree = fromMarkdown('*a* b')
    /** @type {Array<string>} */
    const events = []

    visit(tree, {
      exit(node, index, parent) {
        events.push('-' + node.type)

        if (parent && typeof index === 'number' && node.type === 'emphasis') {
          parent.children.splice(index, 1)
          return index
        }
      }
    })

    const paragraph = tree.children[0]
    assert.equal(events.join(' '), '-text -emphasis -text -paragraph -root')
    assert.ok(paragraph.type === 'paragraph')
    assert.equal(paragraph.children.length, 1)
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
         * Check that a requested node is visited.
         *
         * @param node
         *   Visited node.
         * @param index
         *   Index of `node` in `parent`.
         * @param parent
         *   Parent of `node`.
         * @returns {undefined}
         *   Nothing.
         */
        function (node, index, parent) {
          const info = '(' + (parent && parent.type) + ':' + index + ')'
          assert.ok(test(node, index), 'should be a requested node ' + info)
          n++
        }
      )

      assert.equal(n, 3, 'should visit all passing nodes')

      /**
       * Check if a node is after the fourth child.
       *
       * @param {Node} _
       *   Node.
       * @param {number | undefined} index
       *   Index of node in its parent.
       * @returns {boolean}
       *   Whether the node is after the fourth child.
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
        assert.equal(parent.type, 'root')
        parent.children.push(other)
      }
    })

    assert.equal(n, l, 'should walk over all nodes')
  })
})
