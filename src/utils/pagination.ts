export function getPaginationBasePath(pathname: string): string {
  const normalized = pathname.replace(/\d+\/$/, '');
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
}

export function getTotalPages(totalItems: number, pageSize: number): number {
  if (pageSize <= 0) return 0;
  return Math.ceil(Math.max(0, totalItems) / pageSize);
}

export function createPaginationLinkBuilder(
  pathname: string,
): (pageNumber: number) => string {
  const basePath = getPaginationBasePath(pathname);

  return (pageNumber: number) =>
    pageNumber === 1 ? basePath : `${basePath}${pageNumber}/`;
}

export function getPageSlice<T>(
  items: T[],
  currentPage: number,
  pageSize: number,
): T[] {
  const safePage = Math.max(1, Math.floor(currentPage));
  const safeSize = Math.max(1, Math.floor(pageSize));
  const startIndex = (safePage - 1) * safeSize;

  return items.slice(startIndex, startIndex + safeSize);
}

export function getPageNumbers(lastPage: number): number[] {
  return Array.from({ length: Math.max(0, lastPage) }, (_, index) => index + 1);
}
