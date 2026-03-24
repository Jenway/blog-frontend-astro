interface TimestampedRecord {
  data?: {
    pubDate?: Date;
    updatedDate?: Date;
  };
}

export const siteOrigin = import.meta.env.SITE || 'https://blog.jenway.link';

export const toAbsoluteUrl = (value: string) =>
  new URL(value, siteOrigin).toString();

export const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

export const formatRfc822 = (value: Date) => value.toUTCString();

export const resolveEntryTimestamp = (entry: TimestampedRecord) =>
  entry.data?.updatedDate ?? entry.data?.pubDate;

export const getLatestTimestamp = (entries: TimestampedRecord[]) =>
  entries.reduce<Date | undefined>((latest, entry) => {
    const timestamp = resolveEntryTimestamp(entry);
    if (!timestamp) return latest;
    if (!latest || timestamp.valueOf() > latest.valueOf()) return timestamp;
    return latest;
  }, undefined);
