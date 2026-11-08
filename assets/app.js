(() => {
  let manifest = { root: { type: 'dir', name: 'Halmos', path: 'notes', children: [] } };
  const byPath = {};
  const $ = (id) => document.getElementById(id);
  const enc = (p) => p.split('/').map(encodeURIComponent).join('/');
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const pretty = (s) => s.replace(/\.md$/i, '').replace(/^!+/, '').replace(/^\d+[-_. ]+/, '').replace(/[-_]/g, ' ');
  const href = (p) => '#' + encodeURI(p);
  let baseDir = '';

  const isRelative = (h) => h && !/^([a-z][a-z0-9+.-]*:|#|\/\/|\/)/i.test(h);
  const resolve = (h) => new URL(h, 'http://x/' + enc(baseDir) + '/').pathname.slice(1);

  const ENVS = [
    [/^(teorema|lemma|proposizione|corollario|congettura|theorem|proposition|corollary|conjecture|claim)\b/i, 'thm'],
    [/^(definizione|esempio|esercizio|osservazione|nota|notazione|definition|example|exercise|remark|observation|note|notation)\b/i, 'defn'],
    [/^(dimostrazione|dim|proof)\b/i, 'proof']
  ];

  marked.use({
    gfm: true,
    renderer: {
      blockquote(quote) {
        const m = quote.match(/^\s*<p>\s*<strong>\s*([^<]*)/i);
        if (m) for (const [re, cls] of ENVS) if (re.test(m[1].trim())) return `<div class="env ${cls}">${quote}</div>\n`;
        return false;
      }
    },
    walkTokens(t) {
      if (t.type === 'image' && isRelative(t.href)) t.href = resolve(t.href);
      if (t.type === 'link' && isRelative(t.href)) {
        const r = resolve(t.href);
        t.href = /\.md($|#)/i.test(r) ? '#' + r : r;
      }
    }
  });

  function render(md) {
    const code = [], math = [];
    md = md.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, (m) => `@@C${code.push(m) - 1}@@`);
    md = md.replace(/`[^`\n]*`/g, (m) => `@@C${code.push(m) - 1}@@`);
    md = md.replace(
      /\\begin\{([A-Za-z*]+)\}[\s\S]*?\\end\{\1\}|\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|(?<![\\$])\$(?![\s$])[^$\n]+?(?<![\s\\])\$(?!\d)/g,
      (m) => `@@M${math.push(m.replace(/^>\s*/gm, '')) - 1}@@`
    );
    md = md.replace(/@@C(\d+)@@/g, (_, i) => code[i]);
    const html = marked.parse(md);
    return html.replace(/@@M(\d+)@@/g, (_, i) => esc(math[i]));
  }

  function figurize(root) {
    root.querySelectorAll('p > img').forEach((img) => {
      const p = img.parentElement;
      if (p.childNodes.length !== 1) return;
      const fig = document.createElement('figure');
      fig.appendChild(img);
      const alt = img.getAttribute('alt');
      if (alt) { const c = document.createElement('figcaption'); c.textContent = alt; fig.appendChild(c); }
      p.replaceWith(fig);
    });
  }

  // ---------- albero ----------
  function indexTree(node, parent) {
    node.parent = parent;
    if (node.path) byPath[node.path] = node;
    (node.children || []).forEach((c) => indexTree(c, node));
  }
  const isDir = (n) => n.type === 'dir';
  const isFile = (n) => n.type === 'file';
  const crumbs = (node) => {
    const out = [];
    for (let p = node && node.parent; p && p !== manifest.root; p = p.parent) out.unshift(pretty(p.name));
    return out.join(' · ');
  };

  function buildMenu(current) {
    const menu = $('menu');
    menu.innerHTML = '';
    const el = (cls, child) => { const d = document.createElement('div'); d.className = cls; d.appendChild(child); menu.appendChild(d); };
    const link = (h, text, cur) => {
      const a = document.createElement('a');
      a.href = h; a.textContent = text;
      if (cur) a.className = 'current';
      return a;
    };
    for (const cat of manifest.root.children.filter(isDir)) {
      el('menu-category', cat.path ? link(href(cat.path), pretty(cat.name), false) : document.createTextNode(pretty(cat.name)));
      for (const c of cat.children) {
        const label = isDir(c) ? pretty(c.name) : c.title;
        const cur = !!current && (current === c.path || current.startsWith(c.path + '/'));
        el('menu-item', link(href(c.path), label, cur));
      }
    }
  }

  function setPage(title, html, sub) {
    $('page-title').textContent = title;
    $('subtitle').textContent = sub || '';
    document.title = title + ' – Halmos';
    $('content').innerHTML = html;
    window.scrollTo(0, 0);
  }

  async function typeset() {
    if (window.MathJax && MathJax.typesetPromise) {
      MathJax.typesetClear && MathJax.typesetClear();
      MathJax.texReset && MathJax.texReset();
      await MathJax.typesetPromise([$('content')]);
    }
  }

  function listHtml(children) {
    return '<ul>' + children.map((c) => {
      if (isFile(c)) return `<li><a href="${href(c.path)}">${esc(c.title)}</a></li>`;
      const name = c.path ? `<a href="${href(c.path)}">${esc(pretty(c.name))}</a>` : esc(pretty(c.name));
      return `<li>${name}${listHtml(c.children)}</li>`;
    }).join('') + '</ul>';
  }

  async function showDir(node) {
    const isRoot = node === manifest.root;
    const files = node.children.filter(isFile);
    const dirs = node.children.filter(isDir);

    if (!isRoot && files.length === 1 && dirs.length === 0) {
      location.replace(href(files[0].path));
      return;
    }
    let html;
    if (!node.children.length) {
      html = '<p>Nessun appunto ancora: aggiungi un file <tt>.md</tt> nella cartella <tt>notes/</tt>.</p>';
    } else if (isRoot) {
      html = dirs.map((c) => `<h2>${esc(pretty(c.name))}</h2>${listHtml(c.children)}`).join('');
    } else {
      html = listHtml(node.children);
    }
    setPage(isRoot ? 'Halmos' : pretty(node.name), html, isRoot ? '' : crumbs(node));
    buildMenu(isRoot ? '' : node.path);
  }

  async function showFile(path) {
    const res = await fetch(enc(path) + '?v=' + Date.now());
    if (!res.ok) throw new Error(res.status);
    let md = await res.text();
    md = md.replace(/^\uFEFF/, '').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, ''); // front matter
    baseDir = path.split('/').slice(0, -1).join('/');
    const entry = byPath[path];
    const title = entry ? entry.title : pretty(path.split('/').pop());
    md = md.replace(/^\s*#\s+.+\r?\n/, '');
    setPage(title, render(md), crumbs(entry));
    figurize($('content'));
    buildMenu(path);
    await typeset();
  }

  async function route() {
    const path = decodeURIComponent(location.hash.slice(1)).replace(/\/+$/, '');
    try {
      if (!path) {
        const first = manifest.root.children.find((c) => isDir(c) && c.path);
        if (first) { location.replace(href(first.path)); return; }
        return await showDir(manifest.root);
      }
      if (path === manifest.root.path) return await showDir(manifest.root);
      if (/\.md$/i.test(path)) return await showFile(path);
      const node = byPath[path];
      if (node && isDir(node)) return await showDir(node);
      throw new Error('not found');
    } catch (e) {
      setPage('Non trovato', '<p>Impossibile caricare questa pagina.</p>', '');
      buildMenu('');
    }
  }

  async function init() {
    try {
      const r = await fetch('manifest.json?v=' + Date.now());
      manifest = await r.json();
      if (manifest.updated) $('updated').textContent = manifest.updated;
    } catch (e) { }
    indexTree(manifest.root, null);
    window.addEventListener('hashchange', route);
    const ready = window.MathJax && MathJax.startup && MathJax.startup.promise;
    if (ready) await ready;
    route();
  }
  window.addEventListener('DOMContentLoaded', init);
})();
