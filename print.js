/* Shows a survey report that a dashboard packed into this page's address (after the #).
   The part after # never leaves the browser. Report HTML is sanitized; this page runs no other code. */
(function(){
  var sheet = document.getElementById('ppSheet'), titleEl = document.getElementById('ppTitle'), hint = document.getElementById('ppHint');
  var mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent), KEY = mac ? '⌘P' : 'Ctrl+P';
  function setHint(html, flag){ hint.innerHTML = html; hint.classList.toggle('flag', !!flag); }
  function fail(msg){
    document.body.classList.remove('po-open');
    document.getElementById('printOverlay').outerHTML = '<div class="pp-empty"></div>';
    document.querySelector('.pp-empty').textContent = msg;
  }
  function doPrint(pdf){
    setHint(pdf ? 'In the print window, set <b>Destination</b> to <b>Save as PDF</b>.' : 'Choose your printer in the print window.', pdf);
    var t = Date.now();
    try { window.print(); } catch (e) {}
    if (Date.now() - t < 300) setHint(pdf ? 'Press <kbd>' + KEY + '</kbd>, then set <b>Destination</b> to <b>Save as PDF</b>.' : 'Press <kbd>' + KEY + '</kbd> to print.', true);
  }
  document.getElementById('ppPrint').addEventListener('click', function(){ doPrint(false); });
  document.getElementById('ppPdf').addEventListener('click', function(){ doPrint(true); });
  setHint('To save a PDF, click Save as PDF.', false);

  var h = location.hash.slice(1);
  if (!h) { fail('This page shows a printable survey report. Open it from a dashboard’s “Print or save as PDF” button.'); return; }
  var dot = h.indexOf('.'), ver = h.slice(0, dot), b64 = h.slice(dot + 1);
  function toBytes(s){ var bin = atob(s.replace(/-/g, '+').replace(/_/g, '/')), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
  var p;
  try {
    var bytes = toBytes(b64);
    if (ver === 'v1') p = new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
    else if (ver === 'v0') p = Promise.resolve(new TextDecoder().decode(bytes));
    else throw new Error('version');
  } catch (e) { p = Promise.reject(e); }
  p.then(function(text){
    var d = JSON.parse(text);
    var css = String(d.css || '')
      .replace(/@import[^;]*;?/gi, '')
      .replace(/url\(\s*(?!['"]?data:image\/(png|gif|jpeg|webp);)[^)]*\)/gi, 'none')
      .replace(/<\/?\s*style/gi, '');
    document.getElementById('rep').textContent = css;
    sheet.innerHTML = DOMPurify.sanitize(String(d.html || ''), {
      FORBID_TAGS: ['a', 'form', 'input', 'button', 'textarea', 'select', 'option', 'iframe', 'frame', 'object', 'embed', 'img', 'video', 'audio', 'source', 'link', 'meta', 'base', 'style', 'script', 'svg', 'math'],
      FORBID_ATTR: ['href', 'src', 'srcset', 'action', 'formaction', 'xlink:href', 'id', 'name'],
      ALLOW_DATA_ATTR: false
    });
    var t = String(d.t || 'Report').slice(0, 200);
    document.title = t; titleEl.textContent = t;
    // Open the print window once this tab is in front (Chrome ignores print in background tabs).
    var printed = false;
    function autoPrint(){ if (printed || document.visibilityState !== 'visible') return; printed = true; setTimeout(function(){ try { window.print(); } catch (e) {} }, 500); }
    document.addEventListener('visibilitychange', autoPrint);
    autoPrint();
  }).catch(function(){
    fail('This report link is incomplete or damaged. Go back to the dashboard and click “Print or save as PDF” again.');
  });
})();
