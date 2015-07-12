# mdast-util-visit [![Build Status](https://img.shields.io/travis/wooorm/mdast-util-visit.svg?style=flat)](https://travis-ci.org/wooorm/mdast-util-visit) [![Coverage Status](https://img.shields.io/coveralls/wooorm/mdast-util-visit.svg?style=flat)](https://coveralls.io/r/wooorm/mdast-util-visit?branch=master)

[**mdast**](https://github.com/wooorm/mdast) utility to recursively walk
over nodes: both forwards and backwards.

## Installation

[npm](https://docs.npmjs.com/cli/install):

```bash
npm install mdast-util-visit
```

**mdast-util-visit** is also available for [bower](http://bower.io/#install-packages),
[component](https://github.com/componentjs/component), and
[duo](http://duojs.org/#getting-started), and as an AMD, CommonJS, and globals
module, [uncompressed](mdast-util-visit.js) and
[compressed](mdast-util-visit.min.js).

## Usage

```js
/*
 * Dependencies.
 */

var mdast = require('mdast');
var visit = require('mdast-util-visit');

/*
 * AST.
 */

var ast = mdast.parse('Some *emphasis*, **strongness**, and `code`.');

visit(ast, 'text', console.log.bind(console));
/*
 * {type: 'text', 'value': 'Some '}
 * {type: 'text', 'value': 'emphasis'}
 * {type: 'text', 'value': ', '}
 * {type: 'text', 'value': 'strongness'}
 * {type: 'text', 'value': ', and '}
 * {type: 'text', 'value': '.'}
 */
```

## API

### visit(ast\[, type\], callback\[, reverse\])

>   `visit` is synchronous.

Visit nodes. Optionally by [node type](https://github.com/wooorm/mdast/blob/master/doc/nodes.md),
Optionally in reverse.

*   `ast` (`Node`)
    — [**mdast** node](https://github.com/wooorm/mdast/blob/master/doc/nodes.md);

*   `type` (`string`, optional)
    — Optional node type to invoke `callback` for. By default, all nodes are
    visited.

*   `callback` (`function(node, index?, parent?)`)
    — Callback when a node (matching `type`) is found. Invoked with the node,
    its index in `parent` (or `null`), and its parent (or `null`).

    Can return `false` to stop checking.

*   `reverse` (`boolean`, default: `false`, optional)
    — When falsey, checking starts at the first child and continues through
    to later children. When truthy, this is reversed.

    This **does not** mean checking starts at the deepest node and continues
    on to the highest node.

## License

[MIT](LICENSE) © [Titus Wormer](http://wooorm.com)
