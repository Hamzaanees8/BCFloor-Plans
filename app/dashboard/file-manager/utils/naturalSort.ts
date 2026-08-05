/**
 * Helper to naturally sort an array of objects or Files by their name property.
 * Example: Image_1.jpg, Image_2.jpg, Image_10.jpg
 */
export function naturalSortFiles<T extends { name: string }>(files: T[]): T[] {
  return [...files].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  );
}
