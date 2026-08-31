/**
 * Username: abbreviation of the full name.
 * - 1 word   -> used as-is                          ("Budi" -> "Budi")
 * - 2 words  -> first 3 letters of each word         ("Budi Santoso" -> "BudSan")
 * - 3+ words -> first 3 of word 1 + first 2 of word 2 + first 2 of the last word
 *               ("Muhammad Abdul Hadi" -> "MuhAbHa")
 *
 * On collision: extend how many letters are taken from each word until unique.
 * Single-word names (which can't be extended) get a trailing number instead.
 */
export function generateUsername(fullName: string, existingUsernames: string[] = []): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "");
  const taken = new Set(existingUsernames.map((u) => u.toLowerCase()));

  const build = (lens: number[]) => {
    if (words.length === 1) return cap(words[0]);
    if (words.length === 2) return words.map((w, i) => cap(w.slice(0, lens[i]))).join("");
    return [
      cap(words[0].slice(0, lens[0])),
      cap(words[1].slice(0, lens[1])),
      cap(words[words.length - 1].slice(0, lens[2])),
    ].join("");
  };

  let lens = words.length === 1 ? [words[0].length] : words.length === 2 ? [3, 3] : [3, 2, 2];
  let username = build(lens);
  let guard = 0;
  while (taken.has(username.toLowerCase()) && guard < 25) {
    guard++;
    if (words.length === 1) {
      username = `${build(lens)}${guard + 1}`;
    } else {
      const wordLens =
        words.length === 2
          ? [words[0].length, words[1].length]
          : [words[0].length, words[1].length, words[words.length - 1].length];
      lens = lens.map((l, i) => Math.min(l + 1, wordLens[i]));
      username = build(lens);
      if (lens.every((l, i) => l === wordLens[i]) && taken.has(username.toLowerCase())) {
        username = `${username}${guard + 1}`;
      }
    }
  }
  return username;
}

export function genTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
