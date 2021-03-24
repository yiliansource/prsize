#!/usr/bin/env node
import path from "path";
import prettyBytes from "pretty-bytes";
import { Command, OptionValues } from "commander";

import { Table } from "./table";
import { Parser, ParseResult, TreeNode } from "./parser";

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
    .action(printStatTree)
    .parse();

/**
 * Prints the statistics tree of the specified root. This can be either a file or a directory.
 *
 * @param root The root where to build the tree from.
 * @param options The command line options passed to the command.
 */
function printStatTree(root: string, options: OptionValues) {
    // By default, the root points to the current working directory.
    root = path.resolve(root || ".");

    // Create the parser and parse the tree, beginning from the root.
    const parser = new Parser();
    const parsedTree = parser.parseTree(root);

    const lineSuffix = " lines";
    const maxDepth = parseInt(options.depth);

    // Make sure that a valid parse tree was generated.
    if (parsedTree) {
        const table = new Table();
        table.head = ["Hierarchy", "Size", "Executable", "Comments", "Total"];

        /**
         * A recursive function to append the parse tree to the table body.
         * This works by expanding the children of the current parse node.
         *
         * @param node The current parse node to inspect.
         * @param depth The current depth of the node.
         */
        function appendToTable(node: TreeNode<ParseResult>, depth = 0): void {
            if (maxDepth > 0 && depth > maxDepth) {
                // If a maximum depth is set, ensure it's not exceeded.
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
                    appendToTable(child, depth + 1);
                }
            }
        }

        // Initialize the recursive operation.
        appendToTable(parsedTree);

        // Finally, print the result.
        console.log(table.format());
    }
}
