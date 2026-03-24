// src/content.config.ts
import { defineCollection, z } from 'astro:content';

const flexibleSchema = z
  .object({
    // --- 所有可能的字段，全部设为可选 ---
    title: z.string().optional(),
    description: z.string().optional(),
    chapter: z.number().optional(),
    pubDate: z.coerce.date().optional(),
    date: z.coerce.date().optional(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().optional(),
    license: z.string().optional(),
    hidden: z.boolean().optional(),
    // --- 兼容 null 的 tags 字段 ---
    tags: z
      .union([z.string(), z.array(z.string())])
      .nullable()
      .optional()
      .transform((val) => {
        if (Array.isArray(val)) return val; // 如果已经是数组，直接返回
        if (typeof val === 'string') return [val]; // 如果是字符串，包装成数组
        return []; // 对于 null 或 undefined，返回空数组
      }),
  })
  .transform((data) => {
    const finalDate = data.pubDate || data.date;

    if (!finalDate) {
      return { ...data, pubDate: new Date() };
    }

    return { ...data, pubDate: finalDate };
  });

// --- 应用到所有集合 ---
const postsCollection = defineCollection({
  type: 'content',
  schema: flexibleSchema.refine((data) => data.title, {
    message: 'Post must have a title.',
  }),
});

const novelsCollection = defineCollection({
  type: 'content',
  schema: flexibleSchema.refine((data) => data.title, {
    message: 'Novel chapter must have a title.',
  }),
});

const treeholesCollection = defineCollection({
  type: 'content',
  schema: flexibleSchema,
});

const tweetsCollection = defineCollection({
  type: 'content',
  schema: flexibleSchema,
});

const archiveCollection = defineCollection({
  type: 'content',
  schema: flexibleSchema,
});

const afterSearchCollection = defineCollection({
  type: 'content',
  schema: flexibleSchema,
});

const legacyBlogCollection = defineCollection({
  type: 'content',
  schema: flexibleSchema,
});

// 导出所有集合
export const collections = {
  Posts: postsCollection,
  Novels: novelsCollection,
  TreeHoles: treeholesCollection,
  Tweets: tweetsCollection,
  Archive: archiveCollection,
  AfterSearch: afterSearchCollection,
  blog: legacyBlogCollection,
};
