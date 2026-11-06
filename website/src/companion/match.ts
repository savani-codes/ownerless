import type { Entry } from "./knowledge";

// A small, dependency-free matcher: normalise the question, then score each entry by the words
// it shares with the entry's keywords and canonical question. Good enough for ~20 entries, and
// fully predictable, which matters more here than cleverness.

const STOPWORDS = new Set(
  "a an and are as at be can could do does did for from has have how i if in into is it its me my of on or our so than that the their them then there these they this to us was we were what when where which who why will with would you your".split(
    " ",
  ),
);

// Words that should still count even though they look like stopwords in this domain.
const KEEP = new Set(["how", "who", "why", "what", "you", "no"]);

const SYNONYMS: Record<string, string> = {
  bots: "agent",
  bot: "agent",
  ai: "agent",
  approver: "approve",
  approvals: "approve",
  permissions: "permission",
  secure: "safe",
  security: "safe",
  dangerous: "safe",
  setup: "install",
  installation: "install",
  running: "run",
  cost: "license",
  pricing: "license",
  architecture: "stack",
  diagram: "stack",
  slack: "discord",
};

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9@\s-]/g, " ")
    .split(/[\s-]+/)
    .map((word) => word.replace(/^@/, ""))
    .filter((word) => word.length > 1 || word === "a")
    .map(stem);
}

export function stem(word: string): string {
  const mapped = SYNONYMS[word] ?? word;
  if (mapped.length > 4 && mapped.endsWith("ing")) return mapped.slice(0, -3);
  if (mapped.length > 4 && mapped.endsWith("ed")) return mapped.slice(0, -2);
  if (mapped.length > 3 && mapped.endsWith("s") && !mapped.endsWith("ss")) return mapped.slice(0, -1);
  // "create" and "created" (now "creat") should meet.
  if (mapped.length > 4 && mapped.endsWith("e")) return mapped.slice(0, -1);
  return mapped;
}

function contentWords(text: string): string[] {
  return tokenize(text).filter((word) => KEEP.has(word) || !STOPWORDS.has(word));
}

export type Match = { entry: Entry; score: number };

/** Scores every entry against the question, best first. */
export function rank(question: string, entries: Entry[]): Match[] {
  const words = new Set(contentWords(question));
  if (words.size === 0) return [];

  return entries
    .map((entry) => {
      const keywords = new Set(entry.keywords.flatMap(tokenize));
      const canonical = new Set(contentWords(entry.question));
      let score = 0;
      for (const word of words) {
        if (keywords.has(word)) score += KEEP.has(word) ? 0.5 : 2;
        if (canonical.has(word)) score += KEEP.has(word) ? 0.5 : 1;
      }
      // Favour entries that cover more of what was asked, not just one loud word.
      return { entry, score: score / Math.sqrt(words.size) };
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score);
}

/** The best answer, or null when nothing matches well enough to be worth saying. */
export function answer(question: string, entries: Entry[], minScore = 1.1): Entry | null {
  const [best] = rank(question, entries);
  return best && best.score >= minScore ? best.entry : null;
}
