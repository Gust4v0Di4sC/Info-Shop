(() => {
  const activateDeferredStylesheets = () => {
    document
      .querySelectorAll('link[data-deferred-stylesheet][media="print"]')
      .forEach(link => {
        link.media = 'all';
      });
  };

  window.addEventListener('load', () => {
    window.setTimeout(() => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(activateDeferredStylesheets, { timeout: 1000 });
        return;
      }

      activateDeferredStylesheets();
    }, 2400);
  }, { once: true });
})();
