(() => {
  const browserDocument = globalThis.document;
  const browserWindow = globalThis.window;

  if (!browserDocument || !browserWindow) return;

  const storageKey = 'gg-posts-index';
  const indexPathPattern = /^\/posts(?:\/\d+)?\/?$/;
  const detailPathPattern = /^\/posts\/.+\/$/;

  const normalizePath = (value) => {
    if (typeof value !== 'string' || value.length === 0) return null;

    try {
      const url = new URL(value, browserWindow.location.origin);
      const path = url.pathname.endsWith('/')
        ? url.pathname
        : `${url.pathname}/`;
      return indexPathPattern.test(path) ? path : null;
    } catch {
      return null;
    }
  };

  const persistIndexPath = () => {
    const path = normalizePath(browserWindow.location.pathname);
    if (!path) return;

    try {
      browserWindow.sessionStorage.setItem(storageKey, path);
    } catch (error) {
      console.warn('Failed to persist posts index path:', error);
    }
  };

  const resolveIndexPath = () => {
    const fromParam = normalizePath(
      new URL(browserWindow.location.href).searchParams.get('from'),
    );
    if (fromParam) return fromParam;

    try {
      const stored = normalizePath(
        browserWindow.sessionStorage.getItem(storageKey),
      );
      if (stored) return stored;
    } catch (error) {
      console.warn('Failed to read posts index path:', error);
    }

    return '/posts/';
  };

  const applyDetailNavigation = () => {
    const indexPath = resolveIndexPath();

    browserDocument
      .querySelectorAll('[data-posts-index-link]')
      .forEach((link) => {
        if (!(link instanceof browserWindow.HTMLAnchorElement)) return;
        link.href = indexPath;
      });

    browserDocument
      .querySelectorAll('[data-post-neighbor-link]')
      .forEach((link) => {
        if (!(link instanceof browserWindow.HTMLAnchorElement)) return;
        const url = new URL(link.href, browserWindow.location.origin);
        url.searchParams.set('from', indexPath);
        link.href = url.pathname + url.search + url.hash;
      });
  };

  const syncPostsNavigation = () => {
    const path = browserWindow.location.pathname;

    if (indexPathPattern.test(path)) {
      persistIndexPath();
      return;
    }

    if (detailPathPattern.test(path)) {
      applyDetailNavigation();
    }
  };

  browserDocument.addEventListener('astro:after-swap', syncPostsNavigation);
  browserDocument.addEventListener('astro:page-load', syncPostsNavigation);

  if (browserDocument.readyState === 'loading') {
    browserDocument.addEventListener('DOMContentLoaded', syncPostsNavigation, {
      once: true,
    });
  } else {
    syncPostsNavigation();
  }
})();
