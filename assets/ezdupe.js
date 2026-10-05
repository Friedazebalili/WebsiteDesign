/* EZ Dupe — site interactions */
(function () {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* header state + scroll progress */
  const hdr = $('.hdr'), prog = $('.progress');
  const onScroll = () => {
    const y = scrollY;
    hdr && hdr.classList.toggle('scrolled', y > 10);
    if (prog) prog.style.setProperty('--p', Math.min(1, y / Math.max(1, document.body.scrollHeight - innerHeight)));
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* mega menu: click/keyboard support (hover handled in CSS) */
  $$('.nav-item').forEach(item => {
    const btn = $('.nav-btn', item);
    btn && btn.addEventListener('click', e => {
      const open = item.classList.contains('open');
      $$('.nav-item.open').forEach(i => i.classList.remove('open'));
      if (!open) item.classList.add('open');
      btn.setAttribute('aria-expanded', String(!open));
      e.stopPropagation();
    });
  });
  document.addEventListener('click', e => { if (!e.target.closest('.nav-item')) $$('.nav-item.open').forEach(i => i.classList.remove('open')); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { $$('.nav-item.open').forEach(i => i.classList.remove('open')); drawer && drawer.classList.remove('open'); } });

  /* mobile drawer */
  const drawer = $('.drawer');
  $$('[data-drawer]').forEach(b => b.addEventListener('click', () => {
    drawer.classList.toggle('open');
    document.body.style.overflow = drawer.classList.contains('open') ? 'hidden' : '';
  }));

  /* split headlines into lines for reveal */
  $$('[data-split]').forEach(el => {
    el.innerHTML = el.innerHTML.split(/<br\s*\/?>/i).map(l => `<span class="split-line"><span>${l}</span></span>`).join('');
  });

  /* reveal on scroll */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .08 }) : null;
  $$('[data-reveal],[data-split]').forEach((el, i) => {
    if (el.dataset.reveal === 'stagger') {
      $$(':scope > *', el).forEach((c, k) => { c.setAttribute('data-reveal', ''); c.style.transitionDelay = (k % 8) * 70 + 'ms'; io ? io.observe(c) : c.classList.add('in'); });
      el.removeAttribute('data-reveal');
      return;
    }
    io ? io.observe(el) : el.classList.add('in');
  });

  /* reveal anything already on screen at load (don't wait for a scroll) */
  requestAnimationFrame(() => $$('[data-reveal],[data-split]').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) el.classList.add('in');
  }));

  /* count-up numbers */
  const counters = $$('[data-count]');
  const cio = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target, end = parseFloat(el.dataset.count), suf = el.dataset.suffix || '';
      cio.unobserve(el);
      if (reduce) { el.textContent = end + suf; return; }
      const t0 = performance.now(), dur = 1600;
      const tick = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(end * e) + suf; if (p < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
  }, { threshold: .5 }) : null;
  counters.forEach(c => cio ? cio.observe(c) : (c.textContent = c.dataset.count + (c.dataset.suffix || '')));

  /* cursor spotlight */
  $$('.spot').forEach(el => el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    el.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));

  /* parallax */
  const px = $$('[data-parallax]');
  if (px.length && !reduce) {
    const run = () => {
      px.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        const k = parseFloat(el.dataset.parallax) || .1;
        el.style.transform = `translate3d(0,${((r.top + r.height / 2) - innerHeight / 2) * -k}px,0)`;
      });
    };
    addEventListener('scroll', () => requestAnimationFrame(run), { passive: true }); run();
  }

  /* hero slider */
  const hero = $('.hero');
  if (hero) {
    const slides = $$('.slide', hero), tabs = $$('.hero-tab', hero);
    const DUR = 6500; let i = 0, timer;
    hero.style.setProperty('--dur', DUR + 'ms');
    const go = n => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('active', k === i));
      tabs.forEach((t, k) => { t.classList.remove('active'); void t.offsetWidth; t.classList.toggle('active', k === i); t.setAttribute('aria-selected', k === i); });
      clearTimeout(timer); if (!reduce) timer = setTimeout(() => go(i + 1), DUR);
    };
    tabs.forEach((t, k) => t.addEventListener('click', () => go(k)));
    $('[data-prev]', hero)?.addEventListener('click', () => go(i - 1));
    $('[data-next]', hero)?.addEventListener('click', () => go(i + 1));
    hero.addEventListener('mouseenter', () => { hero.classList.add('paused'); clearTimeout(timer); });
    hero.addEventListener('mouseleave', () => { hero.classList.remove('paused'); go(i); });
    let sx = null;
    hero.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
    hero.addEventListener('touchend', e => { if (sx === null) return; const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 50) go(i + (d < 0 ? 1 : -1)); sx = null; });
    go(0);
  }

  /* logo marquee: duplicate track for seamless loop */
  $$('.marquee-track').forEach(t => { t.innerHTML += t.innerHTML; });

  /* product finder */
  const finder = $('#finder');
  if (finder) {
    const IMG = {
      miniusb: 'https://ezdupe.com/images/ezdupe/products/flash/miniusb-MKII/MINI-USB-PLUS-MK3.png',
      minisd: 'https://us.ezdupe.com/cdn/shop/files/ezd-sdc07-new_640x.png?v=1780009288',
      mininvme: 'https://ezdupe.com/images/ezdupe/products/hdd/mnvme/MINI-nvme-PLUS-home.png',
      hdmini: 'https://ezdupe.com/images/spsimpleportfolio/hdmini-pro-hdd-ssd-duplicator-c/Slim-HDD-Duplicator_HDD-HPA-copy_300MB-copy-speed_EZ-Dupe_600x600.png',
      cfast: 'https://ezdupe.com/images/spsimpleportfolio/tower-cfast-duplicator-c/pho_3T-CFast-Duplicator_EZ-Dupe_600x600.png',
      disc: 'https://ezdupe.com/images/spsimpleportfolio/blu-ray-bd-duplicator-c/pho_Blu-ray-CD-DVD-Duplicator_600x600.png',
      soho: 'https://us.ezdupe.com/cdn/shop/files/sohonvme-a_640x640.png?v=1624685727',
      pantera: 'https://ezdupe.com/images/ezdupe/products/flash/tusb/31T_USB-Pantera_EZ-Dupe.png',
      cyclone: 'https://ezdupe.com/images/ezdupe/webpage/home/NVMe_CyCLONE_BG_M.png',
      erase: 'https://us.ezdupe.com/cdn/shop/products/ezd-op04-c300_600x.png?v=1629742824'
    };
    const ENTRY = {
      usb: ['Mini USB Series', 'miniusb', 'Compact Mini USB systems are a strong fit for smaller target counts and straightforward flash-drive duplication.'],
      sd: ['Mini SD Series', 'minisd', 'Compact SD / microSD systems handle everyday card duplication with simple standalone operation.'],
      nvme: ['Mini NVMe Plus', 'mininvme', 'Plug-and-copy NVMe duplication in a compact, standalone desktop format.'],
      hdd: ['HDmini (Pro)', 'hdmini', 'Compact 2.5-inch and 3.5-inch SATA HDD / SSD duplication for office use.'],
      cf: ['CF / CFast Duplicator', 'cfast', 'Professional duplication systems built for CompactFlash and CFast media.'],
      optical: ['Disc Duplicator', 'disc', 'Standalone optical duplication for Blu-ray, CD and DVD production workflows.']
    };
    const state = { media: 'usb', count: '1-4', flow: 'simple' };
    const out = $('.finder-result', finder), title = $('[data-f-title]', finder), text = $('[data-f-text]', finder), img = $('[data-f-img]', finder), go = $('[data-f-go]', finder), tag = $('[data-f-tag]', finder);
    const decide = () => {
      const { media, count, flow } = state;
      if (flow === 'touch') return ['SOHO Touch Series', 'soho', 'SOHO Touch systems bring copy, compare, erase and format controls into an intuitive touch-screen interface.'];
      if (flow === 'volume' || count === '32+') return ['Pantera Series', 'pantera', 'Pantera systems are built around professional, high-volume duplication with expanded target counts and advanced copy modes.'];
      if (flow === 'speed' && media === 'nvme') return ['NVMe CyCLONE', 'cyclone', 'CyCLONE is the stronger starting point for performance-focused M.2 NVMe duplication.'];
      if (flow === 'erase') return ['Pantera / CyCLONE Pro', 'erase', 'Selected professional systems include multiple erase modes for controlled data sanitization workflows.'];
      if (count === '16-31') return ['Pantera Series', 'pantera', 'Larger target counts call for production-class Pantera systems with expanded ports and advanced copy modes.'];
      return ENTRY[media] || ENTRY.usb;
    };
    const render = () => {
      const [name, key, desc] = decide();
      out.classList.add('swap');
      setTimeout(() => {
        title.textContent = name; text.textContent = desc; img.src = IMG[key]; img.alt = 'EZ Dupe ' + name;
        tag.textContent = 'Recommended for ' + $(`[data-k=media] [aria-pressed=true]`, finder).textContent.trim();
        go.href = 'collection.html#' + state.media;
        out.classList.remove('swap');
      }, 180);
    };
    $$('[data-k]', finder).forEach(group => {
      const k = group.dataset.k;
      $$('.opt', group).forEach(b => b.addEventListener('click', () => {
        $$('.opt', group).forEach(x => x.setAttribute('aria-pressed', 'false'));
        b.setAttribute('aria-pressed', 'true');
        state[k] = b.dataset.v; render();
      }));
    });
  }

  /* collection filtering */
  const grid = $('#grid');
  if (grid) {
    const cards = $$('.pcard', grid), promo = $('.promo', grid), count = $('[data-count-label]'), empty = $('.empty');
    const st = { media: 'all', flow: 'all', q: '' };
    const apply = () => {
      let n = 0;
      cards.forEach(c => {
        const ok = (st.media === 'all' || c.dataset.media === st.media) &&
          (st.flow === 'all' || (c.dataset.flow || '').includes(st.flow)) &&
          (!st.q || c.textContent.toLowerCase().includes(st.q));
        c.classList.toggle('hide', !ok); if (ok) n++;
      });
      if (promo) promo.style.display = st.media === 'all' && st.flow === 'all' && !st.q ? '' : 'none';
      count.textContent = n + (n === 1 ? ' system' : ' systems');
      empty.classList.toggle('show', n === 0);
    };
    const setMedia = v => {
      st.media = v;
      $$('[data-media-filter] .opt').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
      apply();
    };
    $$('[data-media-filter] .opt').forEach(b => b.addEventListener('click', () => { setMedia(b.dataset.v); history.replaceState(null, '', b.dataset.v === 'all' ? location.pathname : '#' + b.dataset.v); }));
    $$('[data-flow-filter] .opt').forEach(b => b.addEventListener('click', () => {
      const on = b.getAttribute('aria-pressed') === 'true';
      $$('[data-flow-filter] .opt').forEach(x => x.setAttribute('aria-pressed', 'false'));
      if (!on) b.setAttribute('aria-pressed', 'true');
      st.flow = on ? 'all' : b.dataset.v; apply();
    }));
    $('[data-search]')?.addEventListener('input', e => { st.q = e.target.value.trim().toLowerCase(); apply(); });
    $('[data-sort]')?.addEventListener('change', e => {
      const v = e.target.value, price = c => parseFloat(c.dataset.price) || (v === 'low' ? 1e9 : -1);
      const sorted = [...cards].sort((a, b) => v === 'low' ? price(a) - price(b) : v === 'high' ? price(b) - price(a) : a.dataset.i - b.dataset.i);
      sorted.forEach(c => grid.appendChild(c));
      if (promo) grid.insertBefore(promo, grid.children[Math.min(6, grid.children.length - 1)]);
    });
    const fromHash = () => { const h = location.hash.slice(1); if (h && $(`[data-media-filter] .opt[data-v="${h}"]`)) setMedia(h); };
    addEventListener('hashchange', () => { fromHash(); $('#shop')?.scrollIntoView({ behavior: 'smooth' }); }); fromHash(); apply();
  }

  /* product page: qty + sub-nav highlight */
  $$('.qty').forEach(q => {
    const input = $('input', q);
    $$('button', q).forEach(b => b.addEventListener('click', () => { input.value = Math.max(1, (parseInt(input.value) || 1) + (+b.dataset.d)); }));
  });
  const sublinks = $$('.subnav nav a');
  if (sublinks.length && 'IntersectionObserver' in window) {
    const sio = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) sublinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    sublinks.forEach(a => { const t = $(a.getAttribute('href')); t && sio.observe(t); });
  }

  /* demo-only buttons */
  $$('[data-demo]').forEach(b => b.addEventListener('click', e => {
    e.preventDefault();
    const old = b.innerHTML; b.innerHTML = b.dataset.demo; setTimeout(() => b.innerHTML = old, 1600);
  }));
})();
