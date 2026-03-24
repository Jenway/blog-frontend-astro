(() => {
  const browserDocument = globalThis.document;
  const browserWindow = globalThis.window;

  if (!browserDocument || !browserWindow) return;

  const sourceSelector = '[data-header-context-source]';
  const targetSelector = '[data-header-context-title]';
  const headerSelector = '.site-header';
  const stateAttribute = 'data-header-context-active';
  const offset = 8;

  let cleanup = null;

  const clearHeaderContext = () => {
    const target = browserDocument.querySelector(targetSelector);
    const header = browserDocument.querySelector(headerSelector);

    if (target instanceof browserWindow.HTMLElement) {
      target.textContent = '';
    }

    if (header instanceof browserWindow.HTMLElement) {
      header.setAttribute(stateAttribute, 'false');
    }
  };

  const setupHeaderContext = () => {
    cleanup?.();
    cleanup = null;
    clearHeaderContext();

    const source = browserDocument.querySelector(sourceSelector);
    const target = browserDocument.querySelector(targetSelector);
    const header = browserDocument.querySelector(headerSelector);

    if (
      !(source instanceof browserWindow.HTMLElement) ||
      !(target instanceof browserWindow.HTMLElement) ||
      !(header instanceof browserWindow.HTMLElement)
    ) {
      return;
    }

    target.textContent = source.textContent?.trim() ?? '';

    let rafId = 0;
    const timeoutIds = [];

    const sync = () => {
      rafId = 0;
      const headerBottom = header.getBoundingClientRect().bottom;
      const sourceTop = source.getBoundingClientRect().top;
      const shouldShow = sourceTop <= headerBottom + offset;
      header.setAttribute(stateAttribute, shouldShow ? 'true' : 'false');
    };

    const queueSync = (delay = 0) => {
      if (delay <= 0) {
        sync();
        return;
      }

      const timeoutId = browserWindow.setTimeout(sync, delay);
      timeoutIds.push(timeoutId);
    };

    const scheduleFrameSync = () => {
      if (rafId !== 0) {
        browserWindow.cancelAnimationFrame(rafId);
      }

      rafId = browserWindow.requestAnimationFrame(sync);
    };

    const handleViewportChange = () => {
      sync();
      scheduleFrameSync();
    };

    queueSync();
    scheduleFrameSync();
    queueSync(80);
    queueSync(220);

    if (browserDocument.readyState !== 'complete') {
      browserWindow.addEventListener('load', sync, { once: true });
    }

    browserDocument.fonts?.ready?.then(sync).catch(() => {});

    browserWindow.addEventListener('scroll', handleViewportChange, {
      passive: true,
    });
    browserWindow.addEventListener('resize', handleViewportChange);

    cleanup = () => {
      if (rafId !== 0) {
        browserWindow.cancelAnimationFrame(rafId);
        rafId = 0;
      }
      timeoutIds.forEach((timeoutId) => browserWindow.clearTimeout(timeoutId));
      browserWindow.removeEventListener('scroll', handleViewportChange);
      browserWindow.removeEventListener('resize', handleViewportChange);
    };
  };

  browserDocument.addEventListener('astro:after-swap', setupHeaderContext);
  browserDocument.addEventListener('astro:page-load', setupHeaderContext);

  if (browserDocument.readyState === 'loading') {
    browserDocument.addEventListener('DOMContentLoaded', setupHeaderContext, {
      once: true,
    });
  } else {
    setupHeaderContext();
  }
})();
