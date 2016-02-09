# unist-util-visit [![Build Status](https://img.shields.io/travis/wooorm/unist-util-visit.svg)](https://travis-ci.org/wooorm/unist-util-visit) [![Coverage Status](https://img.shields.io/codecov/c/github/wooorm/unist-util-visit.svg)](https://codecov.io/github/wooorm/unist-util-visit?branch=master)

[**Unist**](https://github.com/wooorm/unist) node visitor. Useful when working
with [**remark**](https://github.com/wooorm/remark) or
[**retext**](https://github.com/wooorm/retext).

## Installation

[npm](https://docs.npmjs.com/cli/install):

```bash
npm install unist-util-visit
```

**unist-util-visit** is also available for [bower](http://bower.io/#install-packages),
[component](https://github.com/componentjs/component), and
[duo](http://duojs.org/#getting-started), and as an AMD, CommonJS, and globals
module, [uncompressed](unist-util-visit.js) and
[compressed](unist-util-visit.min.js).

## Usage

```js
var remark = require('remark');
var visit = require('unist-util-visit');

remark().use(function () {
    return function (ast) {
        visit(ast, 'text', console.log.bind(console));
    };
}).process('Some *emphasis*, **strongness**, and `code`.');
```

Yields:

```js
{'type': 'text', 'value': 'Some '}
{'type': 'text', 'value': 'emphasis'}
{'type': 'text', 'value': ', '}
{'type': 'text', 'value': 'strongness'}
{'type': 'text', 'value': ', and '}
{'type': 'text', 'value': '.'}
```

## API

### visit([node](https://github.com/wooorm/unist#unist-nodes)\[, type], callback\[, reverse])

>   `visit` is synchronous.

Visit nodes. Optionally by node type. Optionally in reverse.

*   `node` (`Node`)
    — [**Unist** node](https://github.com/wooorm/unist#unist-nodes);

*   `type` (`string`, optional)
    — Optional node type to invoke `callback` for. By default, all nodes are
    visited.

*   `callback` (`function(node, index?, parent?)`)
    — Callback invoked when a node (matching `type`?) is found. Invoked with
    the node, its `index` in `parent` (or `null`), and its `parent` (or `null`).

    Can return `false` to immediately stop checking.

*   `reverse` (`boolean`, default: `false`, optional)
    — When falsey, checking starts at the first child and continues through
    to later children. When truthy, this is reversed.

    This **does not** mean checking starts at the deepest node and continues
    on to the highest node.

## License

[MIT](LICENSE) © [Titus Wormer](http://wooorm.com)
