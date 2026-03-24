import type { CollectionEntry } from 'astro:content';

type PostEntry = CollectionEntry<'Posts'>;

export interface TagSummary {
  label: string;
  count: number;
}

export const normalizeTag = (tag: string) => tag.trim();

export const normalizeTags = (tags: string[] = []) =>
  tags
    .map((tag) => (typeof tag === 'string' ? normalizeTag(tag) : ''))
    .filter(
      (tag, index, array) => tag.length > 0 && array.indexOf(tag) === index,
    );

export const buildTagHref = (tag: string) =>
  `/tags/${encodeURIComponent(normalizeTag(tag))}/`;

export const collectPostTags = (posts: PostEntry[]) => {
  const counts = new Map<string, number>();

  posts.forEach((post) => {
    normalizeTags(post.data.tags).forEach((tag) => {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    });
  });

  const collator = new Intl.Collator('zh-Hans', {
    numeric: true,
    sensitivity: 'base',
  });

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count;
      return collator.compare(left.label, right.label);
    });
};

export const filterPostsByTag = (posts: PostEntry[], tag: string) => {
  const normalized = normalizeTag(tag);
  return posts.filter((post) =>
    normalizeTags(post.data.tags).includes(normalized),
  );
};
