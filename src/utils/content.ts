import { getCollection, type CollectionEntry } from 'astro:content';
import type { collections as ContentCollections } from 'src/content.config';

// 定义一个类型别名，代表所有可能的集合名称
type CollectionName = keyof typeof ContentCollections;

/**
 * 获取所有公开的、已排序的内容条目。
 * @param collection - 要查询的集合名称 (e.g., 'Posts')
 */
export async function getPublicEntries(
  collection: CollectionName,
): Promise<CollectionEntry<CollectionName>[]> {
  // 1. 获取集合的原始数据
  const entries = await getCollection(collection, ({ data }) => {
    return data.hidden !== true;
  });

  // 2. 按 pubDate 排序
  entries.sort((a, b) => {
    const dateA = a.data.pubDate.valueOf();
    const dateB = b.data.pubDate.valueOf();
    return dateB - dateA;
  });

  // 3. 返回
  return entries;
}
