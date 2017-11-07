'use strict';

var test = require('tape');
var remark = require('remark');
var visit = require('./index.js');

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
    'should fail without tree'
  );

  t.throws(
    function () {
      visit(tree);
    },
    'should fail without visitor'
  );

  t.test('should iterate over all nodes', function (st) {
    var n = -1;

    visit(tree, function (node) {
      st.equal(node.type, types[++n]);
    });

    st.equal(n, types.length - 1, 'should visit all nodes');

    st.end();
  });

  t.test('should iterate over all nodes, backwards', function (st) {
    var n = -1;

    visit(tree, function (node) {
      st.equal(node.type, reverseTypes[++n]);
    }, true);

    st.equal(n, reverseTypes.length - 1, 'should visit all nodes');

    st.end();
  });

  t.test('should only visit a given `type`', function (st) {
    var n = 0;

    visit(tree, 'text', function (node) {
      n++;
      st.equal(node.type, 'text');
    });

    st.equal(n, textNodes, 'should visit all matching nodes');

    st.end();
  });

  t.test('should only visit given `type`s', function (st) {
    var n = 0;
    var types = ['text', 'inlineCode'];

    visit(tree, types, function (node) {
      n++;
      st.ok(types.indexOf(node.type) !== -1, 'should be a requested type: ' + node.type);
    });

    st.equal(n, textNodes + codeNodes, 'should visit all matching nodes');

    st.end();
  });

  t.test('should accept any `is`-compatible test', function (st) {
    var n = 0;
    var test = function (node, index) {
      return index > 3;
    };

    visit(tree, test, function (node, index, parent) {
      n++;
      var parentType = parent && parent.type;
      st.ok(index > 3, 'should be a requested node: ' + parentType + '/[' + index + ']');
    });

    st.equal(n, 3, 'should visit all matching nodes');

    st.end();
  });

  t.test('should accept an array of `is`-compatible tests', function (st) {
    var n = 0;
    var tests = [
      function (node) {
        return node.type === 'root';
      },
      'paragraph',
      {value: '.'},
      ['emphasis', 'strong']
    ];
    var expectedTypes = ['root', 'paragraph', 'emphasis', 'strong'];

    visit(tree, tests, function (node) {
      n++;
      st.ok(expectedTypes.indexOf(node.type) !== -1 || node.value === '.',
          'should be a requested type: ' + node.type);
    });

    st.equal(n, 5, 'should visit all matching nodes');

    st.end();
  });

  t.test('should stop if `visitor` stops', function (st) {
    var n = -1;

    visit(tree, function (node) {
      st.equal(node.type, types[++n]);

      if (n === STOP) {
        return false;
      }
    });

    st.equal(n, STOP, 'should visit all nodes');

    st.end();
  });

  t.test('should stop if `visitor` stops, backwards', function (st) {
    var n = -1;

    visit(tree, function (node) {
      st.equal(node.type, reverseTypes[++n]);

      if (n === STOP) {
        return false;
      }
    }, true);

    st.equal(n, STOP, 'should visit all nodes');

    st.end();
  });

  t.end();
});
