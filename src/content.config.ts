// src/content.config.ts
import { defineCollection, z } from 'astro:content';

const flexibleSchema = z
  .object({
    // --- 所有可能的字段，全部设为可选 ---
    title: z.string().optional(),
    description: z.string().optional(),
    chapter: z.number().optional(),
    pubDate: z.date().optional(),
    date: z.date().optional(),
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
  .transform((data, ctx) => {
    const finalDate = data.pubDate || data.date;

    // 如果两个日期字段都找不到
    if (!finalDate) {
      // 添加一个非致命的警告
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Missing 'pubDate' or 'date' in file. Using current date as fallback.`,
      });
      // 返回一个带有备用日期的数据对象
      return { ...data, pubDate: new Date() };
    }

    // 如果找到了日期，就正常返回
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

// 导出所有集合
export const collections = {
  Posts: postsCollection,
  Novels: novelsCollection,
  TreeHoles: treeholesCollection,
  Tweets: tweetsCollection,
};
