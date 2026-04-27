/**
 * Seeded Fisher-Yates shuffle — deterministic shuffle from a string seed.
 * Same seed always produces the same ordering.
 *
 * Used to shuffle sections, questions, and options per-student using their
 * unique shuffleSeed stored in ExamAttempt.
 */

function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return function () {
    h ^= h << 13;
    h ^= h >> 17;
    h ^= h << 5;
    return (h >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(arr: T[], seed: string): T[] {
  const result = [...arr];
  const rand = seededRandom(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Usage:
 *   Sections:  seededShuffle(sections, seed)
 *   Questions: seededShuffle(questions, seed + sectionId)
 *   Options:   seededShuffle(options, seed + questionId)
 */
