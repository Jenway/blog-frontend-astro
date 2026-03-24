import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

function normalizeLegacyMath() {
  const visit = (node) => {
    if (!node || typeof node !== 'object') return;

    if (node.type === 'math' || node.type === 'inlineMath') {
      node.value = node.value
        .replace(/\\\\(?=[A-Za-z])/g, '\\')
        .replace(/\\_/g, '_');
    }

    if (Array.isArray(node.children)) {
      node.children.forEach(visit);
    }
  };

  return (tree) => {
    visit(tree);
  };
}

export default defineConfig({
  site: 'https://blog.jenway.link',
  output: 'static',
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
        'plaintext',
      ],
      wrap: true,
    },
    remarkPlugins: [remarkMath, normalizeLegacyMath],
    rehypePlugins: [rehypeKatex],
  },
  devToolbar: {
    enabled: true,
  },
  vite: {
    build: {
      sourcemap: true,
      chunkSizeWarningLimit: 1000,
    },
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
  },
  server: {
    port: 4321,
    open: true,
  },
});
