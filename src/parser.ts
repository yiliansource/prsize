import fs from "fs";
import path from "path";
import { sum } from "./util";

/**
 * Represents a generic node that can have other nodes as children.
 */
export type TreeNode<T> = T & { children?: TreeNode<T>[] };

/**
 * Represents the result of a parse operation.
 */
export interface ParseResult {
    /**
     * The type of the parse result.
     */
    type: ParseType;
    /**
     * The name of the file or directory that was parsed.
     */
    name: string;
    /**
     * The path of the file or directory that was parsed.
     */
    path: string;

    /**
     * The size of the file or directory, in bytes.
     */
    size: number;
    /**
     * The information on the lines contained in the file or directory.
     */
    lines: LineInformation;
}
/**
 * Represents information on the lines contained in a file or directory.
 */
export interface LineInformation {
    /**
     * The total number of lines.
     */
    total: number;
    /**
     * The number of commented lines.
     */
    comment: number;
    /**
     * The number of non-empty, non-commented lines.
     */
    executable: number;
}

/**
 * Represents the type of a parse result.
 */
export enum ParseType {
    file,
    directory,
}

/**
 * The current state of the parser.
 */
enum ParserState {
    normal,
    lineComment,
    multiLineComment,
}

/**
 * Represents information on how to parse a language.
 */
interface LanguageParseInformation {
    /**
     * The expression to use for tokenizing a file.
     */
    tokenizer: RegExp;

    /**
     * A string representing a line comment token.
     */
    lineCommentToken?: string;
    /**
     * A string representing a multiline comment starting token.
     */
    multiCommentStartToken?: string;
    /**
     * A string representing a multiline comment ending token.
     */
    multiCommentEndToken?: string;
}

/**
 * Represents a parser, that can be used to extract statistics on files.
 */
export class Parser {
    /**
     * An array of directories to ignore.
     */
    private readonly ignores = [".git", "node_modules", "dist", "build"];

    /**
     * Parses the specified file and returns the result.
     *
     * @param file The full path of the file to parse.
     */
    public parseFile(file: string): ParseResult {
        const stats = fs.statSync(file);
        const content = fs.readFileSync(file, "utf-8");

        const lines = content.split("\n");
        const linesTotal = lines.length;
        const linesEmpty = lines.filter((l) => /^\s*$/.test(l)).length;

        const lang = path.extname(file).slice(1);
        const info = this.getParseInformation(lang);

        if (!info) {
            // If we weren't able to find information on how to parse, return undefined.
            return undefined;
        }

        const eol = "\n";
        const tokens = content.match(info.tokenizer);

        let comments = 0;

        // Simple parsing state machine; we consume tokens while we have them,
        // potentially switching between states if we encounter tokens that
        // indicate comments.

        if (tokens && tokens.length > 0) {
            let state: ParserState = ParserState.normal;
            for (const token of tokens) {
                switch (state) {
                    case ParserState.normal:
                        if (token === info.lineCommentToken) {
                            state = ParserState.lineComment;
                        } else if (token === info.multiCommentStartToken) {
                            state = ParserState.multiLineComment;
                        }
                        break;
                    case ParserState.lineComment:
                        if (token === eol) {
                            state = ParserState.normal;
                            comments++;
                        }
                        break;
                    case ParserState.multiLineComment:
                        if (token === eol) {
                            comments++;
                        } else if (token === info.multiCommentEndToken) {
                            state = ParserState.normal;
                            comments++;
                        }
                        break;
                }
            }
        }

        const lineInfos: LineInformation = {
            total: linesTotal,
            comment: comments,
            executable: linesTotal - linesEmpty - comments,
        };

        return {
            type: ParseType.file,
            name: path.basename(file),
            path: file,
            size: stats.size,
            lines: lineInfos,
        };
    }

    /**
     * Creates a parse tree, starting from the specified root.
     * The tree will contain parsed information on all files in the directory,
     * or just on a file itself.
     *
     * @param root The full root path of the file or directory to parse.
     */
    public parseTree(root: string): TreeNode<ParseResult> | undefined {
        const lstat = fs.lstatSync(root);

        if (lstat.isFile()) {
            // The root was a file, so we try to parse it. Note that this may return
            // 'undefined' if the file was non-parseable (for example due to an unfamiliar extension).
            return this.parseFile(root);
        }

        if (lstat.isDirectory()) {
            // The root was a directory. If we do not want to ignore the directory,
            // we will parse each file contained.

            const children: TreeNode<ParseResult>[] = [];

            if (this.ignores.includes(path.basename(root))) {
                return undefined;
            }

            const subfiles = fs.readdirSync(root);
            for (const subfilename of subfiles) {
                const subfilepath = path.join(root, subfilename);
                const subtree = this.parseTree(subfilepath);

                // Ensure that a non-undefined subtree was returned.
                // Otherwise it could mean that the file or directory was un-parsable.
                if (subtree) {
                    children.push(subtree);
                }
            }

            if (children.length === 0) {
                // Make sure that we do not return empty trees.
                return undefined;
            }

            return {
                type: ParseType.directory,
                name: path.basename(root) + "/",
                path: root,
                size: sum(children, (child) => child.size),
                lines: {
                    // Group up the statistics of the children.
                    comment: sum(children, (c) => c.lines.comment),
                    executable: sum(children, (c) => c.lines.executable),
                    total: sum(children, (c) => c.lines.total),
                },
                children: children.sort(
                    (a, b) => b.type - a.type || a.name.localeCompare(b.name)
                ),
            };
        }

        return undefined;
    }

    /**
     * Retrieves parsing information for the specified language.
     *
     * @param lang The language to retrieve parsing information for (e.g. "js").
     */
    private getParseInformation(
        lang: string
    ): LanguageParseInformation | undefined {
        const lookup: [string[], LanguageParseInformation][] = [
            [
                ["js", "ts"],
                {
                    tokenizer: /(\/\*)|(\*\/)|(\/{2})|(\w+)|(\s)|(.*?)/g,
                    lineCommentToken: "//",
                    multiCommentStartToken: "/*",
                    multiCommentEndToken: "*/",
                },
            ],
        ];

        for (const entry of lookup) {
            if (entry[0].includes(lang)) {
                return entry[1];
            }
        }

        return undefined;
    }
}
