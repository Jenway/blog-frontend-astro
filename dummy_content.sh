# 清理旧的 dummy content 以免重复
rm -rf src/content/*

# 创建基础目录
mkdir -p src/content/posts src/content/novels src/content/treeholes src/content/tweets

# --- 为 Posts 集合创建占位文件 ---
echo '---
title: "占位文章"
pubDate: 2025-01-01
description: "这是一个用于本地开发的占位文章。"
tags: ["tech", "astro"]
---
本地开发时，你将看到这篇占位文章。' > src/content/posts/dummy-post.md

# --- 为 Novels 集合创建占位文件 ---
echo '---
title: "序章：启程"
chapter: 0
pubDate: 2025-01-01
---
这是一段小说的占位内容。' > src/content/novels/dummy-chapter.md

# --- 为 TreeHoles 集合创建占位文件 ---
echo '---
pubDate: 2025-01-01
---
这是一个树洞的占位片段。' > src/content/treeholes/dummy-hole.md

# --- 为 Tweets 集合创建占位文件 ---
echo '---
pubDate: 2025-01-01
---
这是一个推文的占位片段。' > src/content/tweets/dummy-tweet.md

# 验证并显示最终的结构
echo "✅ Dummy content generated successfully."
exa ./src -T --git-ignore
