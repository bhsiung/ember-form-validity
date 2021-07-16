export function intersection(arr1, arr2) {
  return arr1.filter((key) => arr2.includes(key));
}
