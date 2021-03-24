/**
 * Returns the sum of the specified properties in the array.
 *
 * @param arr The array of which the elements should be summed together.
 * @param getter The path to the property to sum with.
 *
 * @returns The sum of the specified properties in the array.
 */
export function sum<T>(arr: T[], getter: (value: T) => number): number {
    return arr.reduce((acc, cur) => acc + getter(cur), 0);
}
