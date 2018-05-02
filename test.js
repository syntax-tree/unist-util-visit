'use strict';

var assert = require('assert');
var test = require('tape');
var remark = require('remark');
var visit = require('.');

var tree = remark().parse('Some _emphasis_, **importance**, and `code`.');

var STOP = 5;
var SKIP = 7;
var SKIP_REVERSE = 6;

var textNodes = 6;
var codeNodes = 1;

var types = [
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
];

var reverseTypes = [
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
];

/* Tests. */
test('unist-util-visit', function (t) {
  t.throws(
    function () {
      visit();
    },
    /TypeError: visitor is not a function/,
    'should fail without tree'
  );

  t.throws(
    function () {
      visit(tree);
    },
    /TypeError: visitor is not a function/,
    'should fail without visitor'
  );

  t.test('should iterate over all nodes', function (st) {
    var n = 0;

    st.doesNotThrow(
      function () {
        visit(tree, visitor);
      },
      'should visit all nodes (#1)'
    );

    st.equal(n, types.length, 'should visit all nodes (#2)');

    st.end();

    function visitor(node) {
      assert.equal(node.type, types[n++], 'should be the expected type');
    }
  });

  t.test('should iterate over all nodes, backwards', function (st) {
    var n = 0;

    st.doesNotThrow(
      function () {
        visit(tree, visitor, true);
      },
      'should visit all nodes in reverse (#1)'
    );

    st.equal(n, reverseTypes.length, 'should visit all nodes in reverse (#2)');

    st.end();

    function visitor(node) {
      assert.equal(node.type, reverseTypes[n++], 'should be the expected type');
    }
  });

  t.test('should only visit a given `type`', function (st) {
    var n = 0;

    st.doesNotThrow(
      function () {
        visit(tree, 'text', visitor);
      },
      'should visit all matching nodes (#1)'
    );

    st.equal(n, textNodes, 'should visit all matching nodes (#2)');

    st.end();

    function visitor(node) {
      n++;
      assert.equal(node.type, 'text', 'should be the expected type');
    }
  });

  t.test('should only visit given `type`s', function (st) {
    var n = 0;
    var types = ['text', 'inlineCode'];

    st.doesNotThrow(
      function () {
        visit(tree, types, visitor);
      },
      'should visit all matching nodes (#1)'
    );

    st.equal(n, textNodes + codeNodes, 'should visit all matching nodes (#2)');

    st.end();

    function visitor(node) {
      n++;
      assert.notEqual(types.indexOf(node.type), -1, 'should be a requested type: ' + node.type);
    }
  });

  t.test('should accept any `is`-compatible test function', function (st) {
    var n = 0;

    st.doesNotThrow(
      function () {
        visit(tree, test, visitor);
      },
      'should visit all passing nodes (#1)'
    );

    st.equal(n, 3, 'should visit all passing nodes (#2)');

    st.end();

    function visitor(node, index, parent) {
      var parentType = parent && parent.type;
      n++;
      assert.ok(index > 3, 'should be a requested node (' + parentType + ':' + index + ')');
    }

    function test(node, index) {
      return index > 3;
    }
  });

  t.test('should accept an array of `is`-compatible tests', function (st) {
    var n = 0;
    var expected = ['root', 'paragraph', 'emphasis', 'strong'];

    st.doesNotThrow(
      function () {
        visit(tree, [test, 'paragraph', {value: '.'}, ['emphasis', 'strong']], visitor);
      },
      'should visit all passing nodes (#1)'
    );

    st.equal(n, 5, 'should visit all passing nodes (#2)');

    st.end();

    function visitor(node) {
      n++;

      assert.ok(
        expected.indexOf(node.type) !== -1 || node.value === '.',
        'should be a requested type: ' + node.type
      );
    }

    function test(node) {
      return node.type === 'root';
    }
  });

  t.test('should stop if `visitor` stops', function (st) {
    var n = 0;

    st.doesNotThrow(
      function () {
        visit(tree, visitor);
      },
      'should visit nodes until `visit.EXIT` is given (#1)'
    );

    st.equal(n, STOP, 'should visit nodes until `visit.EXIT` is given (#2)');

    st.end();

    function visitor(node) {
      assert.equal(node.type, types[n++], 'should be the expected type');

      if (n === STOP) {
        return visit.EXIT;
      }
    }
  });

  t.test('should stop if `visitor` stops, backwards', function (st) {
    var n = 0;

    st.doesNotThrow(
      function () {
        visit(tree, visitor, true);
      },
      'should visit nodes until `visit.EXIT` is given (#1)'
    );

    st.equal(n, STOP, 'should visit nodes until `visit.EXIT` is given (#2)');

    st.end();

    function visitor(node) {
      assert.equal(node.type, reverseTypes[n++], 'should be the expected type');

      if (n === STOP) {
        return visit.EXIT;
      }
    }
  });

  t.test('should skip if `visitor` skips', function (st) {
    var n = 0;
    var count = 0;

    st.doesNotThrow(
      function () {
        visit(tree, visitor);
      },
      'should visit nodes except when `visit.SKIP` is given (#1)'
    );

    st.equal(count, types.length - 1, 'should visit nodes except when `visit.SKIP` is given (#2)');

    st.end();

    function visitor(node) {
      assert.equal(node.type, types[n++], 'should be the expected type');
      count++;

      if (n === SKIP) {
        n++; /* The one node inside it. */
        return visit.SKIP;
      }
    }
  });

  t.test('should skip if `visitor` skips, backwards', function (st) {
    var n = 0;
    var count = 0;

    st.doesNotThrow(
      function () {
        visit(tree, visitor, true);
      },
      'should visit nodes except when `visit.SKIP` is given (#1)'
    );

    st.equal(count, reverseTypes.length - 1, 'should visit nodes except when `visit.SKIP` is given (#2)');

    st.end();

    function visitor(node) {
      assert.equal(node.type, reverseTypes[n++], 'should be the expected type');
      count++;

      if (n === SKIP_REVERSE) {
        n++; /* The one node inside it. */
        return visit.SKIP;
      }
    }
  });

  t.test('should support a given `index` to iterate over next (`0` to reiterate)', function (st) {
    var n = 0;
    var again = false;
    var expected = [
      'root',
      'paragraph',
      'text',
      'emphasis',
      'text',
      'text',
      'strong',
      'text',
      'text', /* Again. */
      'emphasis',
      'text',
      'text',
      'strong',
      'text',
      'text',
      'inlineCode',
      'text'
    ];

    st.doesNotThrow(
      function () {
        visit(tree, visitor);
      },
      'should visit nodes again (#1)'
    );

    st.equal(n, expected.length, 'should visit nodes again (#2)');

    st.end();

    function visitor(node) {
      assert.equal(node.type, expected[n++], 'should be the expected type');

      if (again === false && node.type === 'strong') {
        again = true;
        return 0; /* Start over. */
      }
    }
  });

  t.test('should support a given `index` to iterate over next (`children.length` to skip further children)', function (st) {
    var n = 0;
    var again = false;
    var expected = [
      'root',
      'paragraph',
      'text',
      'emphasis',
      'text',
      'text',
      'strong', /* Skip here. */
      'text'
    ];

    st.doesNotThrow(
      function () {
        visit(tree, visitor);
      },
      'should skip nodes (#1)'
    );

    st.equal(n, expected.length, 'should skip nodes (#2)');

    st.end();

    function visitor(node, index, parent) {
      assert.equal(node.type, expected[n++], 'should be the expected type');

      if (again === false && node.type === 'strong') {
        again = true;
        return parent.children.length; /* Skip siblings. */
      }
    }
  });

  t.test('should support any other given `index` to iterate over next', function (st) {
    var n = 0;
    var again = false;
    var expected = [
      'root',
      'paragraph',
      'text',
      'emphasis',
      'text',
      'text',
      'strong',
      'text',
      'inlineCode', /* Skip to here. */
      'text'
    ];

    st.doesNotThrow(
      function () {
        visit(tree, visitor);
      },
      'should skip nodes (#1)'
    );

    st.equal(n, expected.length, 'should skip nodes (#2)');

    st.end();

    function visitor(node, index) {
      assert.equal(node.type, expected[n++], 'should be the expected type');

      if (again === false && node.type === 'strong') {
        again = true;
        return index + 2; /* Skip to `inlineCode`. */
      }
    }
  });

  t.end();
});
