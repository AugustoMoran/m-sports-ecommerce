/**
 * Fuzzy matching utilities for handling typos and similar terms
 */

/**
 * Levenshtein distance - calculates minimum edits needed to transform one string to another
 * Lower score = better match
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,      // deletion
        matrix[j - 1][i] + 1,      // insertion
        matrix[j - 1][i - 1] + indicator  // substitution
      );
    }
  }

  return matrix[len2][len1];
}

/**
 * Calculates similarity score (0-1, higher = more similar)
 */
function similarityScore(str1, str2) {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLen = Math.max(str1.length, str2.length);
  return 1 - (distance / maxLen);
}

/**
 * Finds best matching terms from a list
 * @param {string} query - search term with potential typos
 * @param {Array<string>} candidates - list of valid terms
 * @param {number} threshold - minimum similarity score (0-1)
 * @returns {Array<string>} - matched terms sorted by similarity
 */
function fuzzyMatch(query, candidates, threshold = 0.6) {
  if (!query || !Array.isArray(candidates)) return [];

  const normalized = query.toLowerCase();
  const scored = candidates
    .map(candidate => ({
      term: candidate,
      score: similarityScore(normalized, candidate.toLowerCase()),
    }))
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score);

  return scored.map(({ term }) => term);
}

module.exports = {
  levenshteinDistance,
  similarityScore,
  fuzzyMatch,
};
