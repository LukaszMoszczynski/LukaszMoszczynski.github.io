import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/utils';

export type Project = CollectionEntry<'projects'>['data'];
export type ProjectEntry = CollectionEntry<'projects'> & { slug: string };

/** Projects of one language, sorted by `order`; `slug` is the file name (`en/wordpress-shop` → `wordpress-shop`). */
export async function getProjects(lang: Lang): Promise<ProjectEntry[]> {
  const entries = await getCollection('projects', (entry) => entry.id.startsWith(`${lang}/`));
  return entries
    .map((entry) => ({ ...entry, slug: entry.id.slice(lang.length + 1) }))
    .sort((first, second) => first.data.order - second.data.order);
}
