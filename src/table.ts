import * as os from "os";

type Stringable = string | { toString(): string };

export type TableCell = Stringable;
export type TableRow = TableCell[];
export type TableHead = TableRow;
export type TableBody = TableRow[];

export interface TablePrintOptions {
    /**
     * The gap to place between cells horizontally.
     */
    gap: number;
    /**
     * Whether or not to include a seperator between the head and the body.
     * Note that if no head exists, no seperator will be added.
     */
    headSeperator: boolean;
}

/**
 * Provides the utility to populate and format an ASCII table.
 */
export class Table {
    /**
     * The header of the table.
     */
    public head?: TableHead;
    /**
     * The body (rows) of the table.
     */
    public body: TableBody = [];

    /**
     * Formats the table using the given options.
     *
     * @returns A formatted, string representation of the table.
     */
    public format(options?: Partial<TablePrintOptions>): string {
        // Populate the options using defaults.
        const filledOptions = Object.assign(
            <TablePrintOptions>{
                gap: 4,
                headSeperator: true,
            },
            options || {}
        );

        // Calculate the widths for all the cells and the total width.
        const cellWidths = this.getCellWidths();
        const totalWidth =
            cellWidths.reduce((a, b) => a + b) +
            filledOptions.gap * cellWidths.length;

        // Formats a row using the pre-calculated widths.
        function formatRow(row: TableRow): string {
            let result = "";
            for (let i = 0; i < row.length; i++) {
                const width = cellWidths[i] + filledOptions.gap;
                result += row[i].toString().padEnd(width);
            }
            return result;
        }

        let result = "";

        // Conditionally include the header, if it exists.
        result += this.head ? formatRow(this.head) + os.EOL : "";
        // Conditionall insert a head seperator, stretched to the table width.
        result +=
            this.head && filledOptions.headSeperator
                ? "-".repeat(totalWidth) + os.EOL
                : "";

        // Iterate over the body and add all the rows.
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
