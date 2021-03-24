/*

The goal is to output a code size report in the following format:

Hierarchy              Size (in bytes)      Executable lines       Comment lines        Total lines
----------------------------------------------------------------------------------------------------------------------
<path to the item>     <filesize> [<%>]    <linecount> [<%>]      <linecount> [<%>]    <linecount> [<%>]
...                                 ...                 ...                     ...                 ...

*/

import path from "path";
import minimist from "minimist";
import prettyBytes from "pretty-bytes";

import { Parser, ParseResult, TreeNode } from "./parser";
import { Table } from "./table";

const argv = minimist(process.argv.slice(2), {
    alias: {
        percentage: "p",
    },
});

const root = path.resolve(argv._[0] || ".");

const parser = new Parser();
const parsedTree = parser.parseTree(root);
const lineSuffix = " lines";
const maxDepth = argv.depth || -1;

if (parsedTree) {
    const table = new Table();
    table.head = ["Hierarchy", "Size", "Executable", "Comments", "Total"];

    const appendToBody = function (
        node: TreeNode<ParseResult>,
        depth: number = 0
    ): void {
        if (maxDepth > 0 && depth > maxDepth) {
            return;
        }

        const hierarchy = " ".repeat(depth * 2) + node.name;
        if (node.children && argv.nodirs) {
            table.body.push([hierarchy]);
        } else {
            table.body.push([
                hierarchy,
                prettyBytes(node.size),
                node.lines.executable + lineSuffix,
                node.lines.comment + lineSuffix,
                node.lines.total + lineSuffix,
            ]);
        }
        if (node.children) {
            for (const child of node.children) {
                appendToBody(child, depth + 1);
            }
        }
    };

    appendToBody(parsedTree);
    console.log(table.format());
}
