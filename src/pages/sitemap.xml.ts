import { getPublicEntries } from '../utils/content';
import { getPageSlice, getTotalPages } from '../utils/pagination';
import {
  escapeXml,
  getLatestTimestamp,
  resolveEntryTimestamp,
  toAbsoluteUrl,
} from '../utils/site-publish';
import { buildTagHref, collectPostTags, filterPostsByTag } from '../utils/tags';

export const prerender = true;

interface SitemapEntry {
  path: string;
  lastmod?: Date;
  changefreq?: string;
  priority?: number;
}

const renderEntry = ({
  path,
  lastmod,
  changefreq,
  priority,
}: SitemapEntry) => `  <url>
    <loc>${escapeXml(toAbsoluteUrl(path))}</loc>
    ${lastmod ? `<lastmod>${lastmod.toISOString()}</lastmod>` : ''}
    ${changefreq ? `<changefreq>${changefreq}</changefreq>` : ''}
    ${typeof priority === 'number' ? `<priority>${priority.toFixed(1)}</priority>` : ''}
  </url>`;

export async function GET() {
  const posts = await getPublicEntries('Posts');
  const novels = await getPublicEntries('Novels');
  const tweets = await getPublicEntries('Tweets');
  const treeholes = await getPublicEntries('TreeHoles');
  const tags = collectPostTags(posts);

  const postPageSize = 10;
  const tweetPageSize = 10;
  const postTotalPages = getTotalPages(posts.length, postPageSize);
  const tweetTotalPages = getTotalPages(tweets.length, tweetPageSize);
  const allContent = [...posts, ...novels, ...tweets, ...treeholes];
  const latestSiteUpdate = getLatestTimestamp(allContent);

  const entries: SitemapEntry[] = [
    {
      path: '/',
      lastmod: latestSiteUpdate,
      changefreq: 'weekly',
      priority: 1,
    },
    {
      path: '/posts/',
      lastmod: getLatestTimestamp(posts),
      changefreq: 'weekly',
      priority: 0.9,
    },
    {
      path: '/tweets/',
      lastmod: getLatestTimestamp(tweets),
      changefreq: 'weekly',
      priority: 0.7,
    },
    {
      path: '/novels/',
      lastmod: getLatestTimestamp(novels),
      changefreq: 'weekly',
      priority: 0.7,
    },
    {
      path: '/treeholes/',
      lastmod: getLatestTimestamp(treeholes),
      changefreq: 'weekly',
      priority: 0.5,
    },
    {
      path: '/tags/',
      lastmod: getLatestTimestamp(posts),
      changefreq: 'weekly',
      priority: 0.5,
    },
  ];

  for (let page = 2; page <= postTotalPages; page += 1) {
    entries.push({
      path: `/posts/${page}/`,
      lastmod: getLatestTimestamp(getPageSlice(posts, page, postPageSize)),
      changefreq: 'weekly',
      priority: 0.7,
    });
  }

  for (let page = 2; page <= tweetTotalPages; page += 1) {
    entries.push({
      path: `/tweets/${page}/`,
      lastmod: getLatestTimestamp(getPageSlice(tweets, page, tweetPageSize)),
      changefreq: 'weekly',
      priority: 0.5,
    });
  }

  posts.forEach((post) => {
    entries.push({
      path: `/posts/${post.slug}/`,
      lastmod: resolveEntryTimestamp(post),
      changefreq: 'monthly',
      priority: 0.8,
    });
  });

  novels.forEach((novel) => {
    entries.push({
      path: `/novels/${novel.slug}/`,
      lastmod: resolveEntryTimestamp(novel),
      changefreq: 'monthly',
      priority: 0.6,
    });
  });

  tags.forEach((tag) => {
    entries.push({
      path: buildTagHref(tag.label),
      lastmod: getLatestTimestamp(filterPostsByTag(posts, tag.label)),
      changefreq: 'weekly',
      priority: 0.4,
    });
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(renderEntry).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
