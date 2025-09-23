import { getCollection, type CollectionEntry } from 'astro:content';
import type { collections as ContentCollections } from 'src/content.config';

// 定义一个类型别名，代表所有可能的集合名称
type CollectionName = keyof typeof ContentCollections;

type SortField = 'pubDate' | 'title';
type SortDirection = 'asc' | 'desc';

interface PublicEntryOptions {
  limit?: number;
  sortBy?: SortField;
  direction?: SortDirection;
  includeDrafts?: boolean;
}

/**
 * 获取所有公开的、已排序的内容条目。
 * @param collection - 要查询的集合名称 (e.g., 'Posts')
 * @param options - 排序、方向和数量限制等可选项
 */
export async function getPublicEntries<C extends CollectionName>(
  collection: C,
  options: PublicEntryOptions = {},
): Promise<CollectionEntry<C>[]> {
  const {
    limit,
    sortBy = 'pubDate',
    direction = 'desc',
    includeDrafts = false,
  } = options;

  try {
    // 1. 获取集合的原始数据
    const entries = await getCollection(collection, ({ data }) => {
      return data.hidden !== true;
    });

    const missingPubDate = entries
      .filter((entry) => entry.data.pubDate === undefined)
      .map((entry) => entry.slug);

    const filteredEntries = includeDrafts
      ? entries
      : entries.filter((entry) => entry.data.pubDate !== undefined);
    const visibleEntries = [...filteredEntries];
    const directionFactor = direction === 'desc' ? -1 : 1;

    const collator =
      sortBy === 'title'
        ? new Intl.Collator('zh-Hans', { numeric: true, sensitivity: 'base' })
        : null;

    // 2. 排序
    visibleEntries.sort((a, b) => {
      if (sortBy === 'title') {
        const titleA = a.data.title ?? a.slug;
        const titleB = b.data.title ?? b.slug;
        return (
          (collator?.compare(titleA, titleB) ?? titleA.localeCompare(titleB)) *
          directionFactor
        );
      }

      const valueA = a.data.pubDate?.valueOf();
      const valueB = b.data.pubDate?.valueOf();

      if (valueA === valueB) return 0;
      if (valueA === undefined) return 1;
      if (valueB === undefined) return -1;

      return valueA > valueB ? directionFactor : -directionFactor;
    });

    if (missingPubDate.length > 0) {
      const uniqueSlugs = [...new Set(missingPubDate)].join(', ');
      console.warn(
        `[content] Missing pubDate for entries in collection "${collection}": ${uniqueSlugs}`,
      );
    }

    // 3. 限制数量
    const normalizedLimit =
      typeof limit === 'number' && limit > 0 ? Math.floor(limit) : undefined;
    return normalizedLimit
      ? visibleEntries.slice(0, normalizedLimit)
      : visibleEntries;
  } catch (error) {
    console.error(`Failed to fetch collection "${collection}":`, error);
    // 返回空数组而不是让应用崩溃
    return [] as CollectionEntry<C>[];
  }
}
