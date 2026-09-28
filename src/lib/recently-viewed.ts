const KEY = "occasions-recently-viewed";
const MAX = 12;

export function getRecentlyViewed(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(slug: string) {
  try {
    const next = [slug, ...getRecentlyViewed().filter((s) => s !== slug)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage unavailable (private mode etc.) - recently viewed just won't persist
  }
}
