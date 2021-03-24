import fs from "fs";
import path from "path";
import { sum } from "./util";

export type TreeNode<T> = T & { children?: T[] };

export enum ParseType {
    file,
    directory,
}

export interface ParseResult {
    type: ParseType;
    name: string;
    path: string;

    size: number;
    lines: LineInformation;
}
export interface LineInformation {
    total: number;
    comment: number;
    executable: number;
}

enum ParserState {
    normal,
    lineComment,
    multiLineComment,
}
interface LanguageParseInformation {
    tokenizer: RegExp;

    lineCommentToken?: string;
    multiCommentStartToken?: string;
    multiCommentEndToken?: string;
}

export class Parser {
    private readonly ignores = [".git", "node_modules", "dist", "build"];
    private readonly extensions = ["js", "ts"];

    public parseFile(file: string): ParseResult {
        const stats = fs.statSync(file);
        const content = fs.readFileSync(file, "utf-8");

        const lines = content.split("\n");
        const linesTotal = lines.length;
        const linesEmpty = lines.filter((l) => /^\s*$/.test(l)).length;

        const lang = path.extname(file).slice(1);
        const info = this.getParseInformation(lang);

        const eol = "\n";
        const tokens = content.match(info.tokenizer);

        let comments = 0;

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

    public parseTree(filepath: string): TreeNode<ParseResult> | undefined {
        const lstat = fs.lstatSync(filepath);

        if (lstat.isFile()) {
            if (!this.extensions.includes(path.extname(filepath).slice(1))) {
                return undefined;
            }

            return this.parseFile(filepath);
        }

        if (lstat.isDirectory()) {
            const children: TreeNode<ParseResult>[] = [];

            if (this.ignores.includes(path.basename(filepath))) {
                return undefined;
            }

            const subfiles = fs.readdirSync(filepath);
            for (const subfilename of subfiles) {
                const subfilepath = path.join(filepath, subfilename);
                const subtree = this.parseTree(subfilepath);

                if (subtree) {
                    children.push(subtree);
                }
            }

            if (children.length === 0) {
                return undefined;
            }

            return {
                type: ParseType.directory,
                name: path.basename(filepath) + "/",
                path: filepath,
                size: sum(children, (child) => child.size),
                lines: {
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

    private getParseInformation(
        lang: string
    ): LanguageParseInformation | undefined {
        const lookup: [string[], LanguageParseInformation][] = [
            [
                ["js", "ts"],
                {
                    tokenizer: /(\w+)|(\s)|(\/\*)|(\*\/)|(\/{2})|(.+)/g,
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
