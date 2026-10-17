import { readFileSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';

type ArchiveFormat = 'markdown' | 'html' | 'pdf';

interface ArchiveMarkdownModule {
  default: unknown;
  frontmatter?: Record<string, unknown>;
}

export interface ArchiveItem {
  slug: string;
  relativePath: string;
  filename: string;
  title: string;
  excerpt: string;
  format: ArchiveFormat;
  formatLabel: string;
  sourceUrl?: string;
  sourceHost?: string;
  savedAt?: Date;
  assetUrl?: string;
  contentComponent?: unknown;
}

const archiveRoot = resolve(process.cwd(), 'src', 'content', 'Archive');

const markdownModules = import.meta.glob<ArchiveMarkdownModule>(
  '../content/Archive/**/*.md',
  { eager: true },
);

const archiveAssetUrls = {
  ...import.meta.glob<string>('../content/Archive/**/*.md', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
  ...import.meta.glob<string>('../content/Archive/**/*.html', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
  ...import.meta.glob<string>('../content/Archive/**/*.pdf', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
};

const archiveItems = buildArchiveItems();

export function getArchiveItems(): ArchiveItem[] {
  return archiveItems;
}

export function getArchiveItemBySlug(slug: string): ArchiveItem | undefined {
  return archiveItems.find((item) => item.slug === slug);
}

export function getArchiveCounts(items = archiveItems): Record<ArchiveFormat, number> {
  return items.reduce<Record<ArchiveFormat, number>>(
    (counts, item) => {
      counts[item.format] += 1;
      return counts;
    },
    {
      markdown: 0,
      html: 0,
      pdf: 0,
    },
  );
}

export function formatArchiveDate(
  value?: Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
): string {
  if (!(value instanceof Date) || Number.isNaN(value.valueOf())) {
    return '时间未标注';
  }

  return new Intl.DateTimeFormat('zh-CN', options).format(value);
}

function buildArchiveItems(): ArchiveItem[] {
  const files = Object.keys(archiveAssetUrls)
    .map((key) => key.replace('../content/Archive/', ''))
    .sort((left, right) =>
      new Intl.Collator('zh-Hans', {
        numeric: true,
        sensitivity: 'base',
      }).compare(left, right),
    );
  const usedSlugs = new Set<string>();

  return files
    .map((file) => buildArchiveItem(file, usedSlugs))
    .sort(compareArchiveItems);
}

function buildArchiveItem(
  relativePath: string,
  usedSlugs: Set<string>,
): ArchiveItem {
  const filename = basename(relativePath);
  const extension = extname(filename).toLowerCase();
  const format = getArchiveFormat(extension);
  const cleanName = cleanArchiveFilename(filename);
  const slug = createArchiveSlug(relativePath, cleanName, usedSlugs);
  const key = `../content/Archive/${relativePath}`;
  const assetUrl = archiveAssetUrls[key];

  let title = cleanName;
  let excerpt = getDefaultExcerpt(format, cleanName);
  let sourceUrl: string | undefined;
  let savedAt: Date | undefined;
  let contentComponent: unknown;

  if (format === 'markdown') {
    const raw = readTextArchiveFile(relativePath);
    const frontmatter = parseFrontmatter(raw);
    const markdownModule = markdownModules[key];

    title =
      getStringValue(frontmatter.title) ??
      extractMarkdownTitle(raw) ??
      cleanName;
    sourceUrl =
      getStringValue(frontmatter.url) ??
      extractMarkdownSourceUrl(raw);
    savedAt = parseArchiveDate(
      getStringValue(frontmatter.savedDate) ??
        getStringValue(frontmatter.saved_date) ??
        getStringValue(frontmatter.pubDate) ??
        getStringValue(frontmatter.date) ??
        extractSavedDate(raw) ??
        extractDateFromFilename(filename),
    );
    excerpt = extractMarkdownExcerpt(raw, title) ?? excerpt;
    contentComponent = markdownModule?.default;
  }

  if (format === 'html') {
    const raw = readTextArchiveFile(relativePath);

    title = extractHtmlTitle(raw) ?? cleanName;
    sourceUrl = extractSourceUrl(raw) ?? extractCanonicalUrl(raw);
    savedAt = parseArchiveDate(
      extractSavedDate(raw) ?? extractDateFromFilename(filename),
    );
    excerpt = extractHtmlDescription(raw) ?? excerpt;
  }

  if (format === 'pdf') {
    savedAt = parseArchiveDate(extractDateFromFilename(filename));
  }

  return {
    slug,
    relativePath,
    filename,
    title,
    excerpt,
    format,
    formatLabel: getFormatLabel(format),
    sourceUrl,
    sourceHost: getSourceHost(sourceUrl),
    savedAt,
    assetUrl,
    contentComponent,
  };
}

function readTextArchiveFile(relativePath: string): string {
  const absolutePath = join(archiveRoot, ...relativePath.split('/'));
  return readFileSync(absolutePath, 'utf8');
}

function getArchiveFormat(extension: string): ArchiveFormat {
  if (extension === '.md') return 'markdown';
  if (extension === '.html') return 'html';
  return 'pdf';
}

function getFormatLabel(format: ArchiveFormat): string {
  if (format === 'markdown') return 'Markdown 摘录';
  if (format === 'html') return 'HTML 快照';
  return 'PDF 文档';
}

function getDefaultExcerpt(format: ArchiveFormat, title: string): string {
  if (format === 'markdown') {
    return '手工整理的摘录条目。';
  }

  if (format === 'html') {
    return `保存的网页快照：${title}`;
  }

  return '保存下来的 PDF 文档。';
}

function cleanArchiveFilename(filename: string): string {
  return filename
    .replace(/\.[^.]+$/u, '')
    .replace(/\s*\(\d{1,2}_\d{1,2}_\d{4}\s+[^)]*\)$/u, '')
    .trim();
}

function createArchiveSlug(
  relativePath: string,
  cleanName: string,
  usedSlugs: Set<string>,
): string {
  const baseSlug = slugify(cleanName) || `archive-${shortHash(relativePath)}`;
  let slug = baseSlug;

  if (usedSlugs.has(slug)) {
    slug = `${baseSlug}-${shortHash(relativePath)}`;
  }

  usedSlugs.add(slug);
  return slug;
}

function slugify(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\+/gu, ' plus ')
    .replace(/['"“”‘’]/gu, '')
    .replace(/[_\s/]+/gu, '-')
    .replace(/[^\p{Letter}\p{Number}-]+/gu, '-')
    .replace(/-+/gu, '-')
    .replace(/^-|-$/gu, '');
}

function shortHash(value: string): string {
  let hash = 2166136261;

  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash >>> 0).toString(36).slice(0, 6);
}

function parseFrontmatter(raw: string): Record<string, string> {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/u);
  if (!match) return {};

  return match[1]
    .split(/\r?\n/u)
    .reduce<Record<string, string>>((frontmatter, line) => {
      const pair = line.match(/^([A-Za-z][\w-]*):\s*(.+)$/u);
      if (!pair) return frontmatter;

      frontmatter[pair[1]] = unquote(pair[2].trim());
      return frontmatter;
    }, {});
}

function unquote(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function stripFrontmatter(raw: string): string {
  return raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/u, '');
}

function extractMarkdownTitle(raw: string): string | undefined {
  const content = stripFrontmatter(raw);
  const headingMatch = content.match(/^\s{0,3}#{1,6}\s+(.+?)\s*$/mu);

  if (headingMatch) {
    return sanitizeInlineMarkdown(headingMatch[1]);
  }

  for (const line of content.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^- (url|saved date):/iu.test(trimmed)) continue;

    const linkMatch = trimmed.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)/iu);
    if (!linkMatch) continue;

    const candidate = sanitizeInlineMarkdown(linkMatch[1]);
    if (candidate === '原文') continue;
    return candidate;
  }

  return undefined;
}

function extractMarkdownSourceUrl(raw: string): string | undefined {
  const metadataMatch = raw.match(/^- url:\s*(https?:\/\/\S+)\s*$/imu);
  if (metadataMatch) return metadataMatch[1];

  const originalMatch = raw.match(/\[原文\]\((https?:\/\/[^\s)]+)/iu);
  if (originalMatch) return originalMatch[1];

  const genericLinkMatch = raw.match(/\[[^\]]+\]\((https?:\/\/[^\s)]+)/iu);
  return genericLinkMatch?.[1];
}

function extractSavedDate(raw: string): string | undefined {
  const match = raw.match(/saved date:\s*(.+)$/imu);
  return match?.[1]?.trim();
}

function extractMarkdownExcerpt(raw: string, title: string): string | undefined {
  const content = stripFrontmatter(raw);

  for (const line of content.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^- (url|saved date):/iu.test(trimmed)) continue;
    if (/^\s{0,3}#{1,6}\s+/u.test(trimmed)) continue;
    if (/^[-*_]{3,}$/u.test(trimmed)) continue;

    const candidate = sanitizeInlineMarkdown(trimmed);

    if (!candidate || candidate === title || candidate === '原文') continue;
    if (candidate.length < 6) continue;

    return truncateText(candidate, 160);
  }

  return undefined;
}

function extractHtmlTitle(raw: string): string | undefined {
  const match = raw.match(/<title[^>]*>([\s\S]*?)<\/title>/iu);
  return match ? decodeHtmlEntities(match[1]).trim() : undefined;
}

function extractHtmlDescription(raw: string): string | undefined {
  const patterns = [
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/iu,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["'][^>]*>/iu,
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match?.[1]) {
      return truncateText(decodeHtmlEntities(match[1].trim()), 160);
    }
  }

  return undefined;
}

function extractSourceUrl(raw: string): string | undefined {
  const match = raw.match(/url:\s*(https?:\/\/\S+)/iu);
  return match?.[1];
}

function extractCanonicalUrl(raw: string): string | undefined {
  const patterns = [
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/iu,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/iu,
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match?.[1]) {
      return decodeHtmlEntities(match[1].trim());
    }
  }

  return undefined;
}

function extractDateFromFilename(filename: string): string | undefined {
  const normalized = filename.normalize('NFKC');
  const match = normalized.match(
    /\((\d{1,2})_(\d{1,2})_(\d{4})\s+(\d{1,2}:\d{2}:\d{2}\s*[AP]M)\)\.[^.]+$/iu,
  );

  if (!match) return undefined;

  const [, month, day, year, time] = match;
  const isoTime = toTwentyFourHourClock(time.toUpperCase());

  if (!isoTime) return undefined;

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${isoTime}+08:00`;
}

function toTwentyFourHourClock(value: string): string | undefined {
  const match = value.match(/^(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)$/u);
  if (!match) return undefined;

  let hour = Number.parseInt(match[1], 10);
  const minute = match[2];
  const second = match[3];
  const meridiem = match[4];

  if (meridiem === 'AM' && hour === 12) hour = 0;
  if (meridiem === 'PM' && hour < 12) hour += 12;

  return `${hour.toString().padStart(2, '0')}:${minute}:${second}`;
}

function parseArchiveDate(value?: string): Date | undefined {
  if (!value) return undefined;

  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? undefined : parsed;
}

function getSourceHost(value?: string): string | undefined {
  if (!value) return undefined;

  try {
    return new URL(value).hostname.replace(/^www\./u, '');
  } catch {
    return undefined;
  }
}

function sanitizeInlineMarkdown(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/gu, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gu, '$1')
    .replace(/`([^`]+)`/gu, '$1')
    .replace(/[*_~>#-]+/gu, ' ')
    .replace(/<[^>]+>/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

function truncateText(value: string, limit: number): string {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit).trimEnd()}…`;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/giu, ' ')
    .replace(/&amp;/giu, '&')
    .replace(/&lt;/giu, '<')
    .replace(/&gt;/giu, '>')
    .replace(/&quot;/giu, '"')
    .replace(/&#39;/giu, "'")
    .replace(/&#x([0-9a-f]+);/giu, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/giu, (_, decimal: string) =>
      String.fromCodePoint(Number.parseInt(decimal, 10)),
    )
    .replace(/\s+/gu, ' ')
    .trim();
}

function compareArchiveItems(left: ArchiveItem, right: ArchiveItem): number {
  const leftTime = left.savedAt?.valueOf();
  const rightTime = right.savedAt?.valueOf();

  if (leftTime !== undefined && rightTime !== undefined && leftTime !== rightTime) {
    return rightTime - leftTime;
  }

  if (leftTime !== undefined) return -1;
  if (rightTime !== undefined) return 1;

  return new Intl.Collator('zh-Hans', {
    numeric: true,
    sensitivity: 'base',
  }).compare(left.title, right.title);
}

function getStringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}
