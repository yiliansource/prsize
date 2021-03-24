import path from "path";

import { describe, it } from "mocha";
import { expect } from "chai";

import { Parser } from "../src/parser";

describe("Parser", function () {
    describe("#parseFile", function () {
        const parser = new Parser();

        const inputPath = path.join(__dirname, "assets/sample.js");
        const expected = {
            executable: 3,
            empty: 1,
            total: 12,
            comments: 8,
        };

        const result = parser.parseFile(inputPath);

        it("calculates executables lines", function () {
            expect(result.lines.executable).to.equal(expected.executable);
        });
        it("calculates commented lines", function () {
            expect(result.lines.comment).to.equal(expected.comments);
        });
        it("calculates total lines", function () {
            expect(result.lines.total).to.equal(expected.total);
        });
    });
});
