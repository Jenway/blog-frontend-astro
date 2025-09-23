export function getPaginationBasePath(pathname: string): string {
  const normalized = pathname.replace(/\d+\/$/, '');
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
}

export function createPaginationLinkBuilder(pathname: string): (pageNumber: number) => string {
  const basePath = getPaginationBasePath(pathname);

  return (pageNumber: number) =>
    pageNumber === 1 ? basePath : `${basePath}${pageNumber}/`;
}

export function getPageNumbers(lastPage: number): number[] {
  return Array.from({ length: Math.max(0, lastPage) }, (_, index) => index + 1);
}
