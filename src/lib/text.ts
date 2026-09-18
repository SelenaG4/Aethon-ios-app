// Standard dynamic-programming edit distance, per docs/BUILD_GUIDE.txt (5.3):
// the minimum number of single-character insertions, deletions or
// substitutions needed to turn `a` into `b`.
export function levenshteinDistance(a: string, b: string): number {
  const rows = a.length + 1
  const cols = b.length + 1
  const distances: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0))

  for (let i = 0; i < rows; i++) distances[i][0] = i
  for (let j = 0; j < cols; j++) distances[0][j] = j

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      if (a[i - 1] === b[j - 1]) {
        distances[i][j] = distances[i - 1][j - 1]
      } else {
        distances[i][j] =
          1 + Math.min(distances[i - 1][j], distances[i][j - 1], distances[i - 1][j - 1])
      }
    }
  }

  return distances[rows - 1][cols - 1]
}
