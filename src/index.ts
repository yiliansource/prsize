#!/usr/bin/env node
import path from "path";
import prettyBytes from "pretty-bytes";
import commander, { Command } from "commander";

import { Parser, ParseResult, TreeNode } from "./parser";
import { Table } from "./table";

const program = new Command();
const meta = require("../package.json");

program
    .name("prsize")
    .version(meta.version)
    .description(meta.description)
    .option("--depth <depth>", "how deep to show the tree", "-1")
    .option("--nodirs", "whether to hide directory-grouped statistics", false)
    .arguments("[root]")
    .usage("[root] [options]")
    .action(printSizeTree)
    .parse();

function printSizeTree(root: string, options: commander.OptionValues) {
    root = path.resolve(root || ".");

    const parser = new Parser();
    const parsedTree = parser.parseTree(root);

    const lineSuffix = " lines";
    const maxDepth = parseInt(options.depth);

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
            if (node.children && options.nodirs) {
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
}
