'use strict';

var assert = require('assert');
var test = require('tape');
var remark = require('remark');
var visit = require('./');

var tree = remark().parse('Some _emphasis_, **importance**, and `code`.');

var STOP = 5;

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

  t.end();
});
