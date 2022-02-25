export function intersection<T>(arr1: T[], arr2: Set<T>): T[] {
  return arr1.filter((key) => arr2.has(key));
}
