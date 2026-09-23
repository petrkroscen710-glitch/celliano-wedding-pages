(() => {
  const script = document.currentScript;
  if (!script) return;
  const src = new URL('svatby/', script.src);
  src.searchParams.set('parentOrigin', location.origin);
  const frame = document.createElement('iframe');
  frame.title = 'Celliano – hudba pro váš svatební den';
  frame.src = src.href;
  frame.style.cssText = 'display:block;width:100%;height:1500px;border:0;background:#faf8f3';
  frame.setAttribute('scrolling', 'no');
  frame.setAttribute('loading', 'eager');
  frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-top-navigation-by-user-activation');
  window.addEventListener('message', event => {
    if (event.origin !== src.origin || event.source !== frame.contentWindow) return;
    if (event.data?.type !== 'celliano:weddings:height') return;
    const height = event.data.height;
    if (typeof height !== 'number' || !Number.isFinite(height) || height < 100 || height > 20000) return;
    frame.style.height = Math.ceil(height) + 'px';
  });
  script.before(frame);
})();