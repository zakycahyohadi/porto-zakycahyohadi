(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fineHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const darkMq = matchMedia('(prefers-color-scheme: dark)');
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- Theme ---------- */
  const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : darkMq.matches;
  const syncTheme = () => root.classList.toggle('is-dark', isDark());
  try { const saved = localStorage.getItem('zch-theme'); if (saved === 'dark' || saved === 'light') root.dataset.theme = saved; } catch (e) {}
  syncTheme();
  darkMq.addEventListener?.('change', syncTheme);
  new MutationObserver(syncTheme).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  $('#themeBtn').addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('zch-theme', next); } catch (e) {}
  });

  /* ---------- Toast ---------- */
  const toastEl = $('#toast'); let toastTimer;
  const toast = (msg) => { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200); };

  /* ---------- Mobile menu ---------- */
  const menu = $('#menu'), menuBtn = $('#menuBtn');
  const setMenu = (open) => {
    menu.classList.toggle('open', open);
    menu.inert = !open;
    root.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  $$('#menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('open')) setMenu(false); });
  matchMedia('(min-width: 861px)').addEventListener?.('change', (e) => { if (e.matches) setMenu(false); });

  /* ---------- Hero word rotator ---------- */
  const rotWords = $$('#rot > span');
  if (!reduce) {
    let ri = 0;
    setInterval(() => {
      const prev = rotWords[ri];
      ri = (ri + 1) % rotWords.length;
      prev.classList.replace('on', 'out');
      rotWords[ri].classList.add('on');
      setTimeout(() => prev.classList.remove('out'), 750);
    }, 2400);
  }

  /* ---------- Interactive dot grid ---------- */
  const canvas = $('#dots'), hero = canvas.parentElement, ctx = canvas.getContext('2d');
  let W = 0, H = 0, heroRunning = true;
  const ptr = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
  const drawDots = (t) => {
    const css = getComputedStyle(root);
    const muted = css.getPropertyValue('--muted').trim(), accent = css.getPropertyValue('--accent').trim();
    ptr.x += (ptr.tx - ptr.x) * 0.15; ptr.y += (ptr.ty - ptr.y) * 0.15;
    if (ptr.tx < -5000) { ptr.x = ptr.tx; ptr.y = ptr.ty; }
    ctx.clearRect(0, 0, W, H);
    const gap = 26, R = 160;
    for (let y = gap / 2; y < H; y += gap) for (let x = gap / 2; x < W; x += gap) {
      const dx = x - ptr.x, dy = y - ptr.y, dist = Math.hypot(dx, dy), f = Math.max(0, 1 - dist / R);
      const wave = reduce ? 0 : Math.sin(x * 0.018 + y * 0.012 + t * 0.0012) * 0.5, push = f * f * 16;
      ctx.beginPath();
      ctx.arc(x + (dist ? dx / dist : 0) * push, y + (dist ? dy / dist : 0) * push, Math.max(0.4, 1.2 + wave + f * 2.8), 0, Math.PI * 2);
      ctx.fillStyle = f > 0.05 ? accent : muted;
      ctx.globalAlpha = f > 0.05 ? 0.35 + f * 0.65 : 0.22;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };
  const resizeDots = () => {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height; canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (reduce) drawDots(0);
  };
  const setPtr = (e) => { const r = canvas.getBoundingClientRect(); ptr.tx = e.clientX - r.left; ptr.ty = e.clientY - r.top; };
  hero.addEventListener('pointermove', setPtr);
  hero.addEventListener('pointerdown', setPtr);
  hero.addEventListener('pointerleave', () => { ptr.tx = -9999; ptr.ty = -9999; });
  resizeDots(); addEventListener('resize', resizeDots);
  if (!reduce) {
    let inView = true;
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; heroRunning = inView && !document.hidden; }).observe(hero);
    document.addEventListener('visibilitychange', () => { heroRunning = inView && !document.hidden; });
    const loop = (t) => { if (heroRunning) drawDots(t); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  } else {
    new MutationObserver(() => drawDots(0)).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    darkMq.addEventListener?.('change', () => drawDots(0));
  }

  /* ---------- Phone screen illustrations ---------- */
  const qrSvg = () => {
    const n = 25; let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const finder = (x, y) => x >= 0 && x < 7 && y >= 0 && y < 7;
    const inFinder = (x, y) => finder(x, y) || finder(x - (n - 7), y) || finder(x, y - (n - 7));
    let rects = '';
    const box = (ox, oy) => {
      rects += `<rect x="${ox}" y="${oy}" width="7" height="7" rx="1.6" fill="#1E1B4B"/><rect x="${ox + 1}" y="${oy + 1}" width="5" height="5" rx="1" fill="#fff"/><rect x="${ox + 2}" y="${oy + 2}" width="3" height="3" rx=".8" fill="#6D7DFF"/>`;
    };
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (inFinder(x, y) || x === 7 || y === 7 || (x === n - 8 && y < 8) || (y === n - 8 && x < 8)) continue;
      if (rnd() > 0.52) rects += `<rect class="m" style="--qd:${((x + y) * 0.06).toFixed(2)}s" x="${x + .08}" y="${y + .08}" width=".84" height=".84" rx=".25" fill="#1E1B4B"/>`;
    }
    box(0, 0); box(n - 7, 0); box(0, n - 7);
    return `<svg viewBox="0 0 ${n} ${n}" aria-hidden="true">${rects}</svg>`;
  };
  const sb = (dark) => `<div class="sb ${dark ? 'dark-sb' : ''}"><span>9:41</span><span>●●● ▮</span></div><div class="island"></div>`;
  const screens = {
    getmove: () => sb(false) + `<div class="app">
      <svg class="gm-map" viewBox="0 0 240 330" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="240" height="330" fill="#E6ECE8"/><rect x="130" y="20" width="100" height="80" rx="8" fill="#CDE6D3"/><rect x="0" y="265" width="80" height="80" rx="8" fill="#CBE0EC"/>
        <g stroke="#fff" stroke-width="11" fill="none" stroke-linecap="round"><path d="M-10 140 H250"/><path d="M-10 250 H250"/><path d="M60 -10 V340"/><path d="M180 -10 V340"/><path d="M0 30 L240 190"/></g>
        <path class="gm-route" d="M60 300 V250 H180 V140 H120 V70" fill="none" stroke="#12A150" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="60" cy="300" r="7" fill="#fff" stroke="#12A150" stroke-width="4"/><circle class="gm-pin" cx="120" cy="70" r="8" fill="#E5484D"/>
      </svg>
      <div class="gm-sheet"><b>Where to?</b>
        <div class="gm-field"><i style="background:#12A150"></i>Current location</div>
        <div class="gm-field"><i style="background:#E5484D"></i>Destination</div>
        <div class="gm-svc"><span class="on">Ride</span><span>Car</span><span>Food</span><span>Send</span></div>
        <div class="gm-btn">Check price</div>
      </div></div>`,
    lookly: () => sb(true) + `<div class="app lookly">
      <div class="lk-top">Lookly</div>
      <div class="lk-view">
        <span class="lk-c tl"></span><span class="lk-c tr2"></span><span class="lk-c bl"></span><span class="lk-c br"></span>
        <svg class="lk-obj" viewBox="0 0 100 100" aria-hidden="true">
          <ellipse cx="46" cy="86" rx="32" ry="5" fill="rgba(255,255,255,.08)"/>
          <path d="M72 40 h7 a12 12 0 0 1 0 24 h-7" fill="none" stroke="#D9C2A8" stroke-width="6"/>
          <rect x="18" y="28" width="56" height="58" rx="10" fill="#D9C2A8"/><ellipse cx="46" cy="30" rx="26" ry="5" fill="#6B4A33"/>
          <path d="M36 18 q4 -6 0 -12 M48 18 q4 -6 0 -12" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span class="lk-scan"></span>
      </div>
      <div class="lk-card"><small>Gemini Vision</small><b>Ceramic coffee mug</b><div class="lk-tags"><span>Object</span><span>Kitchenware</span></div><em>Saved to history</em></div>
      <div class="lk-shutter"><span></span></div></div>`,
    invoice: () => sb(true) + `<div class="app invoice">
      <div class="iv-head"><small>New invoice</small><b>INV-0012</b></div>
      <div class="iv-body">
        <label>Bill to</label><div class="iv-in">Client name</div>
        <div class="iv-2"><div><label>Issued</label><div class="iv-in">12 Mar</div></div><div><label>Due</label><div class="iv-in">26 Mar</div></div></div>
        <label>Items</label>
        <div class="iv-item"><span>Logo design</span><span>Rp 750.000</span></div>
        <div class="iv-item"><span>Social media kit</span><span>Rp 500.000</span></div>
        <div class="iv-item"><span>Revisions × 2</span><span>Rp 200.000</span></div>
        <div class="iv-total"><span>Total</span><b>Rp 1.450.000</b></div>
        <div class="iv-btn">Create invoice</div>
      </div></div>`,
    fluxqr: () => sb(true) + `<div class="app fluxqr">
      <div class="fq-top">Flux<span>QR</span></div>
      <div class="fq-tabs"><span class="on">Generate</span><span>Scan</span></div>
      <div class="fq-in">Paste text or a URL</div>
      <div class="fq-code">${qrSvg()}</div>
      <div class="fq-actions"><span>Download</span><span>Share</span></div></div>`,
    snapcart: () => sb(false) + `<div class="app snapcart">
      <div class="sc-top"><b>SnapCart</b><span class="sc-bag"></span></div>
      <div class="sc-search">Search products</div>
      <div class="sc-chips"><span class="on">All</span><span>Shoes</span><span>Bags</span><span>Watches</span></div>
      <div class="sc-grid">
        <div class="sc-p"><div class="sc-img" style="background:#FAD7C4"><i></i></div><b>Runner shoes</b><span class="sc-star">★★★★☆</span><em>Rp 349K</em></div>
        <div class="sc-p"><div class="sc-img" style="background:#CFE3F5"><i style="border-radius:.6em"></i></div><b>Canvas tote</b><span class="sc-star">★★★★★</span><em>Rp 129K</em></div>
        <div class="sc-p"><div class="sc-img" style="background:#E2DAF5"><i style="width:3.4em;height:3.4em;border-radius:50%"></i></div><b>Classic watch</b><span class="sc-star">★★★★☆</span><em>Rp 499K</em></div>
        <div class="sc-p"><div class="sc-img" style="background:#D8EFD9"><i style="width:3em;height:4em;border-radius:.8em"></i></div><b>Backpack</b><span class="sc-star">★★★★☆</span><em>Rp 259K</em></div>
      </div></div>`,
    newsly: () => sb(false) + `<div class="app newsly">
      <div class="nw-top"><b>Newsly</b><small>● Live</small></div>
      <div class="nw-chips"><span class="on">Terkini</span><span>Teknologi</span><span>Olahraga</span></div>
      <div class="nw-hero"><div class="nw-img"></div><small>Teknologi · 5 menit lalu</small><b>Headline berita terbaru tampil di sini</b></div>
      <div class="nw-row"><div class="nw-thumb" style="background:#F4A261"></div><div><b>Berita ekonomi hari ini</b><small>1 jam lalu</small></div></div>
      <div class="nw-row"><div class="nw-thumb" style="background:#8AB17D"></div><div><b>Sorotan dunia olahraga</b><small>2 jam lalu</small></div></div></div>`,
    quran: () => sb(false) + `<div class="app quran">
      <div class="qr-head"><small>Surah 1</small><b>Al-Fatihah</b><span>Pembukaan · 7 ayat</span></div>
      <p class="qr-bism" dir="rtl" lang="ar">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
      <div class="qr-v"><div class="top"><span class="qr-n">2</span><p dir="rtl" lang="ar">ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ</p></div><small>Segala puji bagi Allah, Tuhan seluruh alam.</small></div>
      <div class="qr-v"><div class="top"><span class="qr-n">3</span><p dir="rtl" lang="ar">ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p></div><small>Yang Maha Pengasih, Maha Penyayang.</small></div>
      <div class="qr-v"><div class="top"><span class="qr-n">4</span><p dir="rtl" lang="ar">مَٰلِكِ يَوْمِ ٱلدِّينِ</p></div><small>Pemilik hari pembalasan.</small></div></div>`,
  };
  $$('[data-screen]').forEach(el => { $('.screen', el).innerHTML = screens[el.dataset.screen](); });

  /* ---------- Hero fan parallax ---------- */
  const fanItems = $$('.fan-item');
  if (!reduce && fineHover) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      fanItems.forEach(it => { const d = +it.dataset.depth; it.style.setProperty('--px', `${x * d}px`); it.style.setProperty('--py', `${y * d}px`); });
    });
    hero.addEventListener('pointerleave', () => fanItems.forEach(it => { it.style.setProperty('--px', '0px'); it.style.setProperty('--py', '0px'); }));
  }

  /* ---------- Magnetic buttons + glow + card tilt ---------- */
  if (!reduce && fineHover) {
    $$('.magnet').forEach(btn => {
      btn.addEventListener('pointermove', (e) => { const r = btn.getBoundingClientRect(); btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.2}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`; });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
    $$('.pcard').forEach(card => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 16}deg`);
        card.style.setProperty('--rx', `${-((e.clientY - r.top) / r.height - 0.5) * 10}deg`);
      });
      card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
    });
  }
  $$('.glow').forEach(el => el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`); el.style.setProperty('--my', `${e.clientY - r.top}px`);
  }));

  /* ---------- Widget tree rebuild ---------- */
  const treeRows = $$('#tree .tr');
  let treeTimers = [];
  const rebuild = () => {
    treeTimers.forEach(clearTimeout); treeTimers = [];
    treeRows.forEach((row, i) => {
      treeTimers.push(setTimeout(() => row.classList.add('lit'), i * 110));
      treeTimers.push(setTimeout(() => row.classList.remove('lit'), i * 110 + 520));
    });
  };
  $('#tree').addEventListener('click', rebuild);

  /* ---------- Project filter ---------- */
  const chips = $$('.chip'), cards = $$('.pcard');
  chips.forEach(chip => chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    chips.forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
    const show = cards.filter(c => f === 'all' || c.dataset.cat === f);
    cards.forEach(c => { c.classList.remove('pending', 'is-in'); if (!show.includes(c) && !c.hidden) c.classList.add('is-out'); });
    setTimeout(() => {
      cards.forEach(c => {
        c.classList.remove('is-out');
        const visible = show.includes(c);
        c.hidden = !visible;
        if (visible) { c.style.animationDelay = `${show.indexOf(c) * 70}ms`; void c.offsetWidth; c.classList.add('is-in'); }
      });
    }, reduce ? 0 : 200);
  }));

  /* ---------- Playground ---------- */
  const m3 = $('#m3'), pgScreen = $('#pgScreen'), insp = $('#insp'), inspectLabel = $('#inspectLabel');
  const codeLines = $$('#code .ln');
  const widgetNames = { theme: 'ThemeData', appbar: 'AppBar', card: 'Card', avatar: 'CircleAvatar', name: 'Text', role: 'Text', chips: 'Wrap › Chip', button: 'FilledButton', nav: 'NavigationBar' };
  let inspected = null, userTouched = false;
  const inspect = (w) => {
    inspected = w;
    codeLines.forEach(l => l.classList.toggle('hl', l.dataset.w === w));
    const target = w === 'theme' ? m3 : $(`[data-w="${w}"]`, m3);
    const sr = pgScreen.getBoundingClientRect(), tr = target.getBoundingClientRect();
    const top = tr.top - sr.top;
    Object.assign(insp.style, { left: `${tr.left - sr.left}px`, top: `${top}px`, width: `${tr.width}px`, height: `${tr.height}px` });
    insp.dataset.label = widgetNames[w];
    insp.classList.toggle('inside', top < 24);
    insp.classList.add('on');
    inspectLabel.innerHTML = `Inspecting <b>${widgetNames[w]}</b>`;
  };
  codeLines.forEach(l => l.addEventListener('click', () => { if (!l.dataset.w) return; userTouched = true; inspect(l.dataset.w); }));
  m3.addEventListener('click', (e) => {
    const el = e.target.closest('[data-w]');
    if (!el) return;
    userTouched = true;
    inspect(el.dataset.w);
  });
  addEventListener('resize', () => { if (inspected) inspect(inspected); });

  const hireBtn = $('#hireBtn'), snack = $('#snack'); let snackTimer;
  hireBtn.addEventListener('pointerdown', (e) => {
    const r = hireBtn.getBoundingClientRect(), s = document.createElement('span'), size = Math.max(r.width, r.height) * 2.2;
    s.className = 'ripple';
    Object.assign(s.style, { width: `${size}px`, height: `${size}px`, left: `${e.clientX - r.left - size / 2}px`, top: `${e.clientY - r.top - size / 2}px` });
    hireBtn.appendChild(s); setTimeout(() => s.remove(), 650);
  });
  hireBtn.addEventListener('click', () => { snack.classList.add('show'); clearTimeout(snackTimer); snackTimer = setTimeout(() => snack.classList.remove('show'), 3200); });
  $$('.m3-nav button').forEach(b => b.addEventListener('click', () => $$('.m3-nav button').forEach(x => x.classList.toggle('on', x === b))));

  const seeds = [['blue', '#1F6FD1'], ['teal', '#00796B'], ['deepPurple', '#6750A4'], ['orange', '#C2410C'], ['pink', '#BE185D']];
  let seedIdx = 0;
  const consoleEl = $('#console'), seedName = $('#seedName');
  const logLine = (html) => {
    const d = document.createElement('div'); d.innerHTML = html; consoleEl.appendChild(d);
    while (consoleEl.children.length > 2) consoleEl.firstElementChild.remove();
  };
  const hotReload = () => {
    seedIdx = (seedIdx + 1) % seeds.length;
    const [name, hex] = seeds[seedIdx];
    logLine('Performing hot reload...');
    setTimeout(() => {
      seedName.textContent = name;
      seedName.classList.remove('flash'); void seedName.offsetWidth; seedName.classList.add('flash');
      m3.style.setProperty('--seed', hex);
      m3.classList.add('bump'); setTimeout(() => m3.classList.remove('bump'), 220);
      const compile = 20 + Math.round(Math.random() * 30), reload = 40 + Math.round(Math.random() * 60), reassemble = 30 + Math.round(Math.random() * 50);
      logLine(`<span class="ok">Reloaded 1 of 1208 libraries in ${compile + reload + reassemble + 12}ms</span> (compile: ${compile} ms, reload: ${reload} ms, reassemble: ${reassemble} ms).`);
      if (!userTouched) inspect('theme');
    }, reduce ? 0 : 260);
  };
  $('#reload').addEventListener('click', () => { userTouched = true; hotReload(); });
  const pgSection = $('#playground');
  let pgVisible = false;
  new IntersectionObserver(([e]) => { pgVisible = e.isIntersecting; }, { threshold: 0.3 }).observe(pgSection);
  addEventListener('keydown', (e) => {
    if (e.key !== 'r' || e.metaKey || e.ctrlKey || e.altKey || !pgVisible) return;
    if (e.target.closest?.('input, textarea, [contenteditable]')) return;
    userTouched = true; hotReload();
  });
  // A short self-guided tour the first time the playground comes into view
  let toured = false;
  new IntersectionObserver(([e], obs) => {
    if (!e.isIntersecting || toured) return;
    toured = true; obs.disconnect();
    if (reduce) { inspect('avatar'); return; }
    ['avatar', 'role', 'button'].forEach((w, i) => setTimeout(() => { if (!userTouched) inspect(w); }, 700 + i * 1300));
  }, { threshold: 0.5 }).observe($('.pg'));

  /* ---------- Certificates ---------- */
  const moreBtn = $('#moreBtn'), moreCerts = $('#moreCerts');
  moreBtn.addEventListener('click', () => {
    const open = !moreCerts.classList.contains('open');
    moreCerts.classList.toggle('open', open);
    moreBtn.setAttribute('aria-expanded', String(open));
    moreBtn.firstChild.textContent = open ? 'Show fewer ' : 'Show all 8 certificates ';
  });

  /* ---------- Count up ---------- */
  const countUp = (el) => {
    const target = +el.dataset.count, start = performance.now();
    const step = (now) => { const k = Math.min(1, (now - start) / 1200); el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };

  /* ---------- Scroll reveal (only content below the first screen starts hidden) ---------- */
  const onReveal = (el) => {
    $$('[data-count]', el).forEach(countUp);
    if (el.classList.contains('b-intern')) el.classList.add('play');
    if (el.classList.contains('b-flutter')) setTimeout(rebuild, 500);
  };
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.remove('pending');
        onReveal(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('[data-reveal]').forEach(el => { if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('pending'); io.observe(el); } });
  }

  /* ---------- Nav state, progress, timeline ---------- */
  const navLinks = $$('.nav-links a');
  const sections = navLinks.map(a => $(a.getAttribute('href')));
  const bar = $('#progress'), exp = $('#exp'), expLine = $('#expLine');
  const onScroll = () => {
    const max = root.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    let cur = -1;
    sections.forEach((s, i) => { if (s.getBoundingClientRect().top < innerHeight * 0.4) cur = i; });
    if (max - scrollY < 4) cur = sections.length - 1;
    navLinks.forEach((a, i) => a.setAttribute('aria-current', String(i === cur)));
    const r = exp.getBoundingClientRect();
    expLine.style.height = `${Math.max(0, Math.min(r.height - 40, innerHeight * 0.6 - r.top))}px`;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Copy email ---------- */
  $('#copyEmail').addEventListener('click', async (e) => {
    const email = e.currentTarget.dataset.email;
    try { await navigator.clipboard.writeText(email); toast('Email copied ✓'); }
    catch (err) {
      const ta = document.createElement('textarea'); ta.value = email; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e2) {}
      ta.remove(); toast(ok ? 'Email copied ✓' : `Copy manually: ${email}`);
    }
  });
  $('#toTop').addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
})();
