(() => {
  const browserDocument = globalThis.document;
  const browserWindow = globalThis.window;

  if (!browserDocument || !browserWindow) return;

  if (browserWindow.__ggCodeCopy) {
    browserWindow.__ggCodeCopy.enhance();
    return;
  }

  const codeButtonSelector = '[data-copy-code-button]';
  const genericButtonSelector = '[data-copy-button]';
  const codeBlockSelector = '.prose-card__body pre, .rich-content pre';
  const copyText = '复制';
  const copiedText = '已复制';
  const failedText = '失败';

  const getButtonLabels = (button) => ({
    idle: button.dataset.copyTextDefault || copyText,
    copied: button.dataset.copyTextSuccess || copiedText,
    failed: button.dataset.copyTextFailed || failedText,
  });

  const setButtonState = (button, state) => {
    const labels = getButtonLabels(button);
    const label =
      state === 'copied'
        ? labels.copied
        : state === 'failed'
          ? labels.failed
          : labels.idle;

    button.dataset.state = state;
    button.textContent = label;
  };

  const enhanceCodeBlocks = (root = browserDocument) => {
    root.querySelectorAll(codeBlockSelector).forEach((pre) => {
      if (!(pre instanceof browserWindow.HTMLPreElement)) return;
      if (pre.querySelector(codeButtonSelector)) return;

      const code = pre.querySelector('code');
      if (!(code instanceof browserWindow.HTMLElement)) return;

      const button = browserDocument.createElement('button');
      button.type = 'button';
      button.className = 'code-copy-button';
      button.setAttribute('data-copy-code-button', '');
      button.setAttribute('aria-label', '复制代码');
      setButtonState(button, 'idle');
      pre.append(button);
    });
  };

  const copyCode = async (button) => {
    const pre = button.closest('pre');
    const code = pre?.querySelector('code');
    if (!(code instanceof browserWindow.HTMLElement)) return;

    const content = code.textContent?.replace(/\s+$/, '');
    if (!content) return;

    try {
      await browserWindow.navigator.clipboard.writeText(content);
      setButtonState(button, 'copied');
    } catch {
      setButtonState(button, 'failed');
    }

    browserWindow.clearTimeout(button.__ggCopyTimer);
    button.__ggCopyTimer = browserWindow.setTimeout(() => {
      setButtonState(button, 'idle');
    }, 1400);
  };

  const copyTextValue = async (button) => {
    const content = button.dataset.copyText;
    if (!content) return;

    try {
      await browserWindow.navigator.clipboard.writeText(content);
      setButtonState(button, 'copied');
    } catch {
      setButtonState(button, 'failed');
    }

    browserWindow.clearTimeout(button.__ggCopyTimer);
    button.__ggCopyTimer = browserWindow.setTimeout(() => {
      setButtonState(button, 'idle');
    }, 1400);
  };

  browserDocument.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof browserWindow.Element)) return;

    const codeButton = target.closest(codeButtonSelector);
    if (codeButton instanceof browserWindow.HTMLButtonElement) {
      event.preventDefault();
      void copyCode(codeButton);
      return;
    }

    const genericButton = target.closest(genericButtonSelector);
    if (!(genericButton instanceof browserWindow.HTMLButtonElement)) return;

    event.preventDefault();
    void copyTextValue(genericButton);
  });

  browserDocument.addEventListener('astro:after-swap', enhanceCodeBlocks);
  browserDocument.addEventListener('astro:page-load', enhanceCodeBlocks);

  browserWindow.__ggCodeCopy = {
    enhance(root) {
      enhanceCodeBlocks(
        root instanceof browserWindow.Element ? root : browserDocument,
      );
    },
  };

  if (browserDocument.readyState === 'loading') {
    browserDocument.addEventListener('DOMContentLoaded', enhanceCodeBlocks, {
      once: true,
    });
  } else {
    enhanceCodeBlocks();
  }
})();
