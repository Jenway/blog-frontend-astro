import { toAbsoluteUrl } from '../utils/site-publish';

export const prerender = true;

export function GET() {
  const body = `User-agent: *
Allow: /

Sitemap: ${toAbsoluteUrl('/sitemap.xml')}
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
