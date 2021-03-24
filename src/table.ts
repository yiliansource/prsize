import * as os from "os";

type Stringable = string | { toString(): string };

export type TableCell = Stringable;
export type TableRow = TableCell[];
export type TableHead = TableRow;
export type TableBody = TableRow[];

export class Table {
    public head?: TableHead;
    public body: TableBody = [];

    public format(options?: Partial<TablePrintOptions>): string {
        const filledOptions = Object.assign(
            <TablePrintOptions>{
                gap: 4,
                headSeperator: true,
            },
            options || {}
        );

        const cellWidths = this.getCellWidths();
        const totalWidth =
            cellWidths.reduce((a, b) => a + b) +
            filledOptions.gap * cellWidths.length;

        function formatRow(row: TableRow): string {
            let result = "";
            for (let i = 0; i < row.length; i++) {
                const width = cellWidths[i] + filledOptions.gap;
                result += row[i].toString().padEnd(width);
            }
            return result;
        }

        let result = "";

        // Conditionally include the header, if it exists
        result += this.head ? formatRow(this.head) + os.EOL : "";
        // Conditionall insert a head seperator, stretched to the table width
        result += filledOptions.headSeperator
            ? "-".repeat(totalWidth) + os.EOL
            : "";

        for (const row of this.body) {
            result += formatRow(row) + os.EOL;
        }

        return result;
    }

    private getCellWidths(): number[] {
        const widths = [];
        const rows = this.body.concat(this.head ? [this.head] : []);

        for (const row of rows) {
            for (let i = 0; i < row.length; i++) {
                const oldLength: number = widths[i] || -1;
                const newLength: number = row[i].toString().length;

                widths[i] = Math.max(oldLength, newLength);
            }
        }

        return widths;
    }
}

export interface TablePrintOptions {
    gap: number;
    headSeperator: boolean;
}
