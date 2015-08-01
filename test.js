'use strict';

/* eslint-env mocha */

/*
 * Dependencies.
 */

var visit = require('./index.js');
var mdast = require('mdast');
var assert = require('assert');

/*
 * Fixture.
 */

var ast = mdast.parse('Some *emphasis*, **strongness**, and `code`.');

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

/*
 * Tests.
 */

describe('unist-util-visit', function () {
    it('should fail without tree', function () {
        assert.throws(function () {
            visit();
        });
    });

    it('should fail without callback', function () {
        assert.throws(function () {
            visit(ast);
        });
    });

    it('should iterate over all nodes', function () {
        var n = -1;

        visit(ast, function (node) {
            assert.equal(node.type, types[++n]);
        });

        assert.equal(n, types.length - 1);
    });

    it('should iterate over all nodes, backwards', function () {
        var n = -1;

        visit(ast, function (node) {
            assert.equal(node.type, reverseTypes[++n]);
        }, true);

        assert.equal(n, reverseTypes.length - 1);
    });

    it('should only visit given `types`', function () {
        var n = 0;

        visit(ast, 'text', function (node) {
            n++;
            assert.equal(node.type, 'text');
        });

        assert.equal(n, textNodes);
    });

    it('should stop when `callback` yields `false`', function () {
        var n = -1;

        visit(ast, function (node) {
            assert.equal(node.type, types[++n]);

            if (n === STOP) {
                return false;
            }
        });

        assert.equal(n, STOP);
    });

    it('should stop when `callback` yields `false`, backwards', function () {
        var n = -1;

        visit(ast, function (node) {
            assert.equal(node.type, reverseTypes[++n]);

            if (n === STOP) {
                return false;
            }
        }, true);

        assert.equal(n, STOP);
    });
});
