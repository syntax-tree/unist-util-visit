'use strict';

var test = require('tape');
var remark = require('remark');
var visit = require('./index.js');

var tree = remark.parse('Some _emphasis_, **strongness**, and `code`.');

var STOP = 5;

var textNodes = 6;

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

  t.test('should only visit given `types`', function (st) {
    var n = 0;

    visit(tree, 'text', function (node) {
      n++;
      st.equal(node.type, 'text');
    });

    st.equal(n, textNodes, 'should visit all nodes');

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
