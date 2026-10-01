import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { SERVICES, type ServiceSlug } from "@/lib/taxonomy";

// Keep the uploaded filenames working; canonical slug names take precedence.
const UPLOADED_NAMES: Partial<Record<ServiceSlug, string[]>> = {
  catering: ["cataring"],
  tents: ["tents & marquees"],
  decor: ["deco"],
  "sound-dj": ["sound & dj", "sound", "dj"],
  photography: ["phohography"],
  "chairs-tables": ["chairs & tables"],
  "mobile-toilets": ["mobile toilets"],
  "mobile-fridges": ["fridge"],
};
const EXTENSIONS = [".png", ".webp", ".avif", ".jpg", ".jpeg"];

function isMissing(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

export async function getCategoryImages(): Promise<Partial<Record<ServiceSlug, string>>> {
  const images: Partial<Record<ServiceSlug, string>> = {};
  const directory = path.join(process.cwd(), "public", "images", "categories");
  let files;
  try {
    files = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (isMissing(error)) return images;
    throw error;
  }

  await Promise.all(SERVICES.map(async ({ slug }) => {
    const names = [slug, ...(UPLOADED_NAMES[slug] ?? [])];
    const file = names.flatMap((name) => EXTENSIONS.flatMap((extension) =>
      files.filter((entry) => entry.isFile() && entry.name.toLowerCase() === `${name}${extension}`),
    ))[0];
    if (!file) return;
    try {
      const info = await stat(path.join(directory, file.name));
      images[slug] = `/images/categories/${encodeURIComponent(file.name)}?v=${info.mtimeMs}`;
    } catch (error) {
      if (!isMissing(error)) throw error;
    }
  }));
  return images;
}
