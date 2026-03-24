import { getPublicEntries } from '../utils/content';
import {
  escapeXml,
  formatRfc822,
  getLatestTimestamp,
  siteOrigin,
  toAbsoluteUrl,
} from '../utils/site-publish';
import { siteCopy } from '../utils/site-copy';
import { normalizeTags } from '../utils/tags';

export const prerender = true;

export async function GET() {
  const posts = await getPublicEntries('Posts');
  const latestPostUpdate = getLatestTimestamp(posts);

  const items = posts
    .map((post) => {
      const url = toAbsoluteUrl(`/posts/${post.slug}/`);
      const description =
        post.data.description ??
        `${post.data.title}，发布于 ${post.data.pubDate.toLocaleDateString('zh-CN')}。`;
      const categories = normalizeTags(post.data.tags)
        .map((tag) => `<category>${escapeXml(tag)}</category>`)
        .join('');
      return `
        <item>
          <title>${escapeXml(post.data.title ?? post.slug)}</title>
          <link>${escapeXml(url)}</link>
          <guid isPermaLink="true">${escapeXml(url)}</guid>
          <description>${escapeXml(description)}</description>
          <pubDate>${formatRfc822(post.data.pubDate)}</pubDate>
          <author>${escapeXml(siteCopy.site.contact_email)} (${escapeXml(siteCopy.site.author_name)})</author>
          ${categories}
        </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteCopy.site.brand_title)}</title>
    <link>${escapeXml(siteOrigin)}</link>
    <description>${escapeXml(siteCopy.site.default_description)}</description>
    <language>zh-CN</language>
    <atom:link href="${escapeXml(toAbsoluteUrl('/rss.xml'))}" rel="self" type="application/rss+xml" />
    ${latestPostUpdate ? `<lastBuildDate>${formatRfc822(latestPostUpdate)}</lastBuildDate>` : ''}
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
}
