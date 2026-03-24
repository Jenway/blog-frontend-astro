const browserDocument = globalThis.document;
const browserWindow = globalThis.window;

(() => {
  if (browserWindow.__ggTheme) {
    browserWindow.__ggTheme.applyStoredMode(false);
    return;
  }

  const storageKey = 'gg-theme';
  const root = browserDocument.documentElement;
  const mediaQuery = browserWindow.matchMedia('(prefers-color-scheme: dark)');
  const labels = {
    light: '日间模式',
    dark: '夜间模式',
    system: '跟随系统',
  };

  const normalizeMode = (value) =>
    value === 'light' || value === 'dark' || value === 'system'
      ? value
      : 'system';

  const resolveTheme = (mode) =>
    mode === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : mode;

  const readStoredMode = () => {
    try {
      return normalizeMode(browserWindow.localStorage.getItem(storageKey));
    } catch (error) {
      console.warn('Theme preference unavailable:', error);
      return 'system';
    }
  };

  const persistMode = (mode) => {
    try {
      browserWindow.localStorage.setItem(storageKey, mode);
    } catch (error) {
      console.warn('Failed to persist theme preference:', error);
    }
  };

  const syncToggles = () => {
    const mode = browserWindow.__ggTheme?.getMode?.() ?? 'system';

    browserDocument
      .querySelectorAll('[data-theme-toggle-button]')
      .forEach((button) => {
        button.setAttribute('data-mode', mode);
        button.setAttribute('aria-expanded', 'false');

        const label = button.parentElement?.querySelector(
          '[data-theme-toggle-label]',
        );
        if (label) {
          label.textContent =
            browserWindow.__ggTheme?.getLabel?.(mode) ?? labels.system;
        }
      });

    browserDocument
      .querySelectorAll('[data-theme-option]')
      .forEach((option) => {
        if (!(option instanceof browserWindow.HTMLButtonElement)) return;
        const optionMode = normalizeMode(option.dataset.themeOption);
        option.setAttribute(
          'aria-pressed',
          optionMode === mode ? 'true' : 'false',
        );
      });
  };

  const applyTheme = (mode, persist = true) => {
    const normalized = normalizeMode(mode);
    const resolvedTheme = resolveTheme(normalized);

    root.setAttribute('data-theme-mode', normalized);
    root.setAttribute('data-theme', resolvedTheme);
    root.style.colorScheme = resolvedTheme;

    if (persist) {
      persistMode(normalized);
    }

    syncToggles();
    return normalized;
  };

  browserWindow.__ggTheme = {
    applyStoredMode(persist = false) {
      return applyTheme(readStoredMode(), persist);
    },
    setMode(mode) {
      return applyTheme(mode);
    },
    getMode() {
      return normalizeMode(root.getAttribute('data-theme-mode'));
    },
    getLabel(mode) {
      return labels[normalizeMode(mode)] ?? labels.system;
    },
  };

  mediaQuery.addEventListener('change', () => {
    if (browserWindow.__ggTheme.getMode() === 'system') {
      browserWindow.__ggTheme.applyStoredMode(false);
    }
  });

  browserDocument.addEventListener('astro:after-swap', () => {
    browserWindow.__ggTheme.applyStoredMode(false);
  });

  browserDocument.addEventListener('astro:page-load', () => {
    syncToggles();
  });

  browserDocument.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof browserWindow.Element)) return;

    const option = target.closest('[data-theme-option]');
    if (!(option instanceof browserWindow.HTMLButtonElement)) return;

    event.preventDefault();
    const mode = normalizeMode(option.dataset.themeOption);
    browserWindow.__ggTheme.setMode(mode);
    option.closest('[data-theme-menu]')?.removeAttribute('open');
  });

  browserDocument.addEventListener('toggle', (event) => {
    const target = event.target;
    if (!(target instanceof browserWindow.HTMLDetailsElement)) return;
    if (!target.hasAttribute('data-theme-menu')) return;

    const button = target.querySelector('[data-theme-toggle-button]');
    if (button) {
      button.setAttribute('aria-expanded', target.open ? 'true' : 'false');
    }
  });

  browserWindow.__ggTheme.applyStoredMode(false);
})();
