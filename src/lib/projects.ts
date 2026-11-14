import { getCollection, render, type CollectionEntry } from 'astro:content';

export const PARTS = [
  { key: 'problem', label: 'the problem' },
  { key: 'for_whom', label: 'for whom' },
  { key: 'key_decision', label: 'the key decision' },
  { key: 'built_with', label: 'built with' },
  { key: 'whats_next', label: 'what’s next' },
] as const;

export type ProjectPart = {
  n: string; // "01"
  label: string; // "the problem"
  text: string; // the short line on the card
  heading: string; // the section's heading in the post
  href: string; // link straight to that section
  id: string;
};

export type Project = {
  entry: CollectionEntry<'projects'>;
  slug: string;
  href: string;
  title: string;
  parts: ProjectPart[];
};

export async function getProjects(): Promise<Project[]> {
  const entries = (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
  return Promise.all(
    entries.map(async (entry) => {
      const { headings } = await render(entry);
      const sections = headings.filter((h) => h.depth === 2);
      if (sections.length !== PARTS.length) {
        throw new Error(
          `src/content/projects/${entry.id}.md needs exactly ${PARTS.length} "## " sections (one per part), found ${sections.length}.`,
        );
      }
      const href = `/projects/${entry.id}/`;
      return {
        entry,
        slug: entry.id,
        href,
        title: entry.data.title,
        parts: PARTS.map((p, i) => ({
          n: String(i + 1).padStart(2, '0'),
          label: p.label,
          text: entry.data.parts[p.key],
          heading: sections[i].text,
          id: sections[i].slug,
          href: `${href}#${sections[i].slug}`,
        })),
      };
    }),
  );
}
