(() => {
  const browserDocument = globalThis.document;
  const browserWindow = globalThis.window;

  if (!browserDocument || !browserWindow) return;

  if (browserWindow.__ggTweetNotes) {
    browserWindow.__ggTweetNotes.refresh();
    return;
  }

  const noteSelector = '[data-tweet-note]';
  const contentSelector = '[data-tweet-note-content]';
  const toggleSelector = '[data-tweet-note-toggle]';
  const bodySelector = '.tweet-note__body';
  const dialogSelector = '[data-tweet-note-dialog]';
  const dialogBodySelector = '[data-tweet-note-dialog-body]';
  const dialogDateSelector = '[data-tweet-note-dialog-date]';
  const dialogCloseSelector = '[data-tweet-note-dialog-close]';
  const observedContents = new WeakSet();

  let refreshFrame = 0;

  const resizeObserver =
    'ResizeObserver' in browserWindow
      ? new browserWindow.ResizeObserver(() => {
          scheduleRefresh();
        })
      : null;

  const measureOverflow = (note, content) => {
    note.dataset.measuring = 'true';
    const isOverflowing = content.scrollHeight > content.clientHeight + 2;
    delete note.dataset.measuring;
    return isOverflowing;
  };

  const syncNote = (note) => {
    if (!(note instanceof browserWindow.HTMLElement)) return;

    const content = note.querySelector(contentSelector);
    const toggle = note.querySelector(toggleSelector);

    if (!(content instanceof browserWindow.HTMLElement)) return;
    if (!(toggle instanceof browserWindow.HTMLButtonElement)) return;

    if (resizeObserver && !observedContents.has(content)) {
      resizeObserver.observe(content);
      observedContents.add(content);
    }

    const isOverflowing = measureOverflow(note, content);

    note.dataset.overflow = isOverflowing ? 'true' : 'false';
    toggle.hidden = !isOverflowing;
  };

  const refresh = () => {
    browserDocument.querySelectorAll(noteSelector).forEach((note) => {
      syncNote(note);
    });
  };

  const scheduleRefresh = () => {
    browserWindow.cancelAnimationFrame(refreshFrame);
    refreshFrame = browserWindow.requestAnimationFrame(refresh);
  };

  const getDialogParts = () => {
    const dialog = browserDocument.querySelector(dialogSelector);
    if (!(dialog instanceof browserWindow.HTMLDialogElement)) return null;

    const dialogBody = dialog.querySelector(dialogBodySelector);
    const dialogDate = dialog.querySelector(dialogDateSelector);

    if (!(dialogBody instanceof browserWindow.HTMLElement)) return null;
    if (!(dialogDate instanceof browserWindow.HTMLElement)) return null;

    return { dialog, dialogBody, dialogDate };
  };

  const openDialog = (note, toggle) => {
    const parts = getDialogParts();
    if (!parts) return;

    const { dialog, dialogBody, dialogDate } = parts;

    const body = note.querySelector(bodySelector);
    if (!(body instanceof browserWindow.HTMLElement)) return;

    dialogBody.replaceChildren(
      ...Array.from(body.childNodes, (node) => node.cloneNode(true)),
    );
    dialogDate.textContent = toggle.dataset.tweetNoteDate || '';

    if (!dialog.open) {
      dialog.showModal();
    }

    browserWindow.__ggCodeCopy?.enhance?.(dialogBody);
  };

  browserDocument.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof browserWindow.Element)) return;

    const toggle = target.closest(toggleSelector);
    if (!(toggle instanceof browserWindow.HTMLButtonElement)) return;

    const note = toggle.closest(noteSelector);
    if (!(note instanceof browserWindow.HTMLElement)) return;
    if (note.dataset.overflow !== 'true') return;

    event.preventDefault();
    openDialog(note, toggle);
  });

  browserDocument.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof browserWindow.Element)) return;

    const closeButton = target.closest(dialogCloseSelector);
    if (closeButton) {
      const dialog = closeButton.closest(dialogSelector);
      if (dialog instanceof browserWindow.HTMLDialogElement) {
        event.preventDefault();
        dialog.close();
      }
      return;
    }

    if (
      target instanceof browserWindow.HTMLDialogElement &&
      target.matches(dialogSelector)
    ) {
      target.close();
    }
  });

  browserWindow.addEventListener('resize', scheduleRefresh, { passive: true });
  browserDocument.addEventListener('astro:after-swap', scheduleRefresh);
  browserDocument.addEventListener('astro:page-load', scheduleRefresh);

  browserWindow.__ggTweetNotes = {
    refresh: scheduleRefresh,
  };

  if (browserDocument.readyState === 'loading') {
    browserDocument.addEventListener('DOMContentLoaded', scheduleRefresh, {
      once: true,
    });
  } else {
    scheduleRefresh();
  }
})();
