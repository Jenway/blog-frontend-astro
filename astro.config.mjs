import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://blog.jenway.link',

  // 输出静态站点（SSG）
  output: 'static',

  // URL 结尾强制加斜杠，利于 SEO 和统一访问
  trailingSlash: 'always',

  markdown: {
    syntaxHighlight: 'shiki',
    syntaxHighlightOptions: {
      theme: {
        light: 'github-light',
        dark: 'github-dark',
      },
      langs: [
        'javascript',
        'typescript',
        'python',
        'bash',
        'yaml',
        'json',
        'c',
        'cpp',
        'powershell',
      ],
      wrap: true,
    },
    // 额外推荐开启的插件示例
    remarkPlugins: [], // 可自定义 remark 插件
    rehypePlugins: [], // 可自定义 rehype 插件
  },

  // Dev 环境调试工具
  devToolbar: {
    enabled: true, // 显示开发者工具栏
  },

  // 优化构建
  vite: {
    build: {
      sourcemap: true, // 构建时生成 source map，方便调试
      chunkSizeWarningLimit: 1000, // 调整 chunk 大小警告阈值，单位 KB
    },
    // 你可以在这里配置 vite 插件、别名等
    resolve: {
      alias: {
        // 你项目常用路径别名
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
  },

  // 如果你用 SSR 渲染，可以设置 server 相关
  server: {
    port: 3000,
    open: true, // 启动后自动打开浏览器
  },

  // 支持国际化（如果需要）
  // integrations: [
  //   // i18n 插件或其它
  // ],

  // 关闭日志（如果觉得输出太多）
  // logging: {
  //   level: 'warn',
  // },

  // 可以开启缓存加速
  // cacheDir: './node_modules/.astro/cache',

  // 预加载相关资源（可选）
  // experimental: {
  //   prefetchTemplate: true,
  // },

  // 更多配置参考官方文档：https://docs.astro.build/en/reference/configuration-reference/
});
