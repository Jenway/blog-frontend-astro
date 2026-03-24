(() => {
  const browserDocument = globalThis.document;
  const browserWindow = globalThis.window;

  if (!browserDocument || !browserWindow) return;

  const selectors = {
    root: '[data-reading-root]',
    article: '[data-reading-article]',
    body: '[data-reading-body]',
    link: '[data-reading-link]',
    progressBar: '[data-reading-progress-bar]',
    currentIndex: '[data-reading-current-index]',
    header: '.site-header',
  };
  const stateAttribute = 'data-reading-enabled';

  let cleanup = null;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const formatIndex = (value) => value.toString().padStart(2, '0');

  const clearReadingRail = () => {
    browserDocument.querySelectorAll(selectors.progressBar).forEach((bar) => {
      if (!(bar instanceof browserWindow.HTMLElement)) return;
      bar.style.setProperty('--reading-progress', '0');
    });

    browserDocument
      .querySelectorAll(selectors.currentIndex)
      .forEach((label) => {
        if (!(label instanceof browserWindow.HTMLElement)) return;
        label.textContent = '00';
      });

    browserDocument.querySelectorAll(selectors.link).forEach((link) => {
      if (!(link instanceof browserWindow.HTMLElement)) return;
      link.removeAttribute('data-reading-state');
      link.removeAttribute('aria-current');
    });

    const header = browserDocument.querySelector(selectors.header);
    if (header instanceof browserWindow.HTMLElement) {
      header.setAttribute(stateAttribute, 'false');
    }
  };

  const setupReadingRail = () => {
    cleanup?.();
    cleanup = null;
    clearReadingRail();

    const root = browserDocument.querySelector(selectors.root);
    const article = browserDocument.querySelector(selectors.article);
    const body = browserDocument.querySelector(selectors.body);
    const header = browserDocument.querySelector(selectors.header);

    if (
      !(root instanceof browserWindow.HTMLElement) ||
      !(article instanceof browserWindow.HTMLElement) ||
      !(body instanceof browserWindow.HTMLElement) ||
      !(header instanceof browserWindow.HTMLElement)
    ) {
      return;
    }

    const currentIndexLabels = Array.from(
      root.querySelectorAll(selectors.currentIndex),
    ).filter((node) => node instanceof browserWindow.HTMLElement);

    const progressBars = Array.from(
      browserDocument.querySelectorAll(selectors.progressBar),
    ).filter((node) => node instanceof browserWindow.HTMLElement);

    const sections = Array.from(root.querySelectorAll(selectors.link))
      .map((link) => {
        if (!(link instanceof browserWindow.HTMLAnchorElement)) return null;
        const targetId = link.dataset.readingTarget;
        if (!targetId) return null;

        const heading = browserDocument.getElementById(targetId);
        if (!(heading instanceof browserWindow.HTMLElement)) return null;

        return { link, heading };
      })
      .filter(Boolean);

    if (sections.length === 0) {
      return;
    }

    header.setAttribute(stateAttribute, 'true');

    let lastActiveIndex = -1;
    const timeoutIds = [];

    const sync = () => {
      const headerBottom = header.getBoundingClientRect().bottom;
      const threshold = headerBottom + 24;
      const articleTop = article.getBoundingClientRect().top;
      const bodyTop = body.getBoundingClientRect().top;

      let activeIndex = -1;

      sections.forEach((section, index) => {
        if (section.heading.getBoundingClientRect().top <= threshold) {
          activeIndex = index;
        }
      });

      if (activeIndex < 0 && articleTop <= threshold) {
        activeIndex = 0;
      }

      sections.forEach((section, index) => {
        let state = 'future';

        if (activeIndex >= 0) {
          state =
            index < activeIndex
              ? 'past'
              : index === activeIndex
                ? 'current'
                : 'future';
        }

        section.link.setAttribute('data-reading-state', state);
        if (state === 'current') {
          section.link.setAttribute('aria-current', 'location');
        } else {
          section.link.removeAttribute('aria-current');
        }
      });

      const currentLabel =
        activeIndex >= 0 ? formatIndex(activeIndex + 1) : '00';
      currentIndexLabels.forEach((label) => {
        label.textContent = currentLabel;
      });

      const viewportHeight = browserWindow.innerHeight;
      const articleStart =
        browserWindow.scrollY +
        bodyTop -
        headerBottom -
        browserWindow.innerHeight * 0.12;
      const articleRange = Math.max(
        body.scrollHeight - viewportHeight * 0.5,
        viewportHeight * 0.35,
        1,
      );
      const progress = clamp(
        (browserWindow.scrollY - articleStart) / articleRange,
        0,
        1,
      );

      progressBars.forEach((bar) => {
        bar.style.setProperty('--reading-progress', progress.toFixed(4));
      });

      if (activeIndex >= 0 && activeIndex !== lastActiveIndex) {
        sections[activeIndex]?.link.scrollIntoView({
          block: 'nearest',
          inline: 'nearest',
        });
      }

      lastActiveIndex = activeIndex;
    };

    const queueSync = (delay = 0) => {
      if (delay <= 0) {
        sync();
        return;
      }

      const timeoutId = browserWindow.setTimeout(sync, delay);
      timeoutIds.push(timeoutId);
    };

    queueSync();
    queueSync(90);
    queueSync(240);

    if (browserDocument.readyState !== 'complete') {
      browserWindow.addEventListener('load', sync, { once: true });
    }

    browserDocument.fonts?.ready?.then(sync).catch(() => {});

    browserWindow.addEventListener('scroll', sync, { passive: true });
    browserWindow.addEventListener('resize', sync);

    cleanup = () => {
      timeoutIds.forEach((timeoutId) => browserWindow.clearTimeout(timeoutId));
      browserWindow.removeEventListener('scroll', sync);
      browserWindow.removeEventListener('resize', sync);
    };
  };

  browserDocument.addEventListener('astro:after-swap', setupReadingRail);
  browserDocument.addEventListener('astro:page-load', setupReadingRail);

  if (browserDocument.readyState === 'loading') {
    browserDocument.addEventListener('DOMContentLoaded', setupReadingRail, {
      once: true,
    });
  } else {
    setupReadingRail();
  }
})();
