// ── Cursor glow ──────────────────────────────────────────────────────────────
(() => {
  const canvas = document.getElementById('cursor-glow');
  const ctx = canvas.getContext('2d');

  const SPACING   = 56;
  const RADIUS    = 520;
  const LINE_ALPHA = 0.22;
  const HALO_ALPHA = 0.32;

  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let W = 0, H = 0;
  let mouseX = -99999, mouseY = -99999;
  let smX = -99999, smY = -99999;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (smX < -1000) { smX = mouseX; smY = mouseY; }
  });
  window.addEventListener('mouseleave', () => {
    mouseX = -99999;
    mouseY = -99999;
  });

  resize();

  function draw() {
    if (mouseX > -1000) {
      smX += (mouseX - smX) * 0.14;
      smY += (mouseY - smY) * 0.14;
    } else {
      smX = -99999;
      smY = -99999;
    }

    ctx.clearRect(0, 0, W, H);

    if (smX > -1000) {
      const halo = ctx.createRadialGradient(smX, smY, 0, smX, smY, RADIUS);
      halo.addColorStop(0,    `rgba(255, 90, 138, ${HALO_ALPHA})`);
      halo.addColorStop(0.30, `rgba(255, 90, 138, ${HALO_ALPHA * 0.45})`);
      halo.addColorStop(0.65, `rgba(255, 90, 138, ${HALO_ALPHA * 0.15})`);
      halo.addColorStop(1,    'rgba(255, 90, 138, 0)');
      ctx.fillStyle = halo;
      ctx.fillRect(smX - RADIUS, smY - RADIUS, RADIUS * 2, RADIUS * 2);

      ctx.save();
      ctx.strokeStyle = `rgba(255, 90, 138, ${LINE_ALPHA})`;
      ctx.lineWidth = 1;

      const minX = Math.floor((smX - RADIUS) / SPACING) * SPACING;
      const maxX = Math.ceil((smX  + RADIUS) / SPACING) * SPACING;
      const minY = Math.floor((smY - RADIUS) / SPACING) * SPACING;
      const maxY = Math.ceil((smY  + RADIUS) / SPACING) * SPACING;

      ctx.beginPath();
      for (let x = minX; x <= maxX; x += SPACING) {
        ctx.moveTo(x + 0.5, smY - RADIUS);
        ctx.lineTo(x + 0.5, smY + RADIUS);
      }
      for (let y = minY; y <= maxY; y += SPACING) {
        ctx.moveTo(smX - RADIUS, y + 0.5);
        ctx.lineTo(smX + RADIUS, y + 0.5);
      }
      ctx.stroke();

      ctx.globalCompositeOperation = 'destination-in';
      const mask = ctx.createRadialGradient(smX, smY, 0, smX, smY, RADIUS);
      mask.addColorStop(0,    'rgba(0,0,0,1)');
      mask.addColorStop(0.30, 'rgba(0,0,0,0.55)');
      mask.addColorStop(0.65, 'rgba(0,0,0,0.20)');
      mask.addColorStop(1,    'rgba(0,0,0,0)');
      ctx.fillStyle = mask;
      ctx.fillRect(smX - RADIUS, smY - RADIUS, RADIUS * 2, RADIUS * 2);

      ctx.restore();
    }

    requestAnimationFrame(draw);
  }

  draw();
})();

// ── App ───────────────────────────────────────────────────────────────────────
(() => {
  const navItems  = document.querySelectorAll('.nav-item');
  const sections  = document.querySelectorAll('.page-section');
  const heroEls   = document.querySelectorAll('.center, .ears, .ear-wash');
  const homeItem  = document.querySelector('.nav-item[data-section="home"]');
  const casesTabs = document.querySelectorAll('.cases-tab');

  // ── Contact form ────────────────────────────────────────────────────────────
  let formStarted    = false;
  let formReady      = false;
  let dismissOverlay = null;

  function startFormLoad() {
    if (formStarted) return;
    formStarted = true;
    const container = document.getElementById('contato-form-container');

    function onReady() {
      formReady = true;
      dismissOverlay?.();
      dismissOverlay = null;
    }

    const observer = new MutationObserver(() => {
      const iframe = container.querySelector('iframe');
      if (!iframe) return;
      observer.disconnect();
      if (iframe.complete || iframe.readyState === 'complete') {
        onReady();
      } else {
        iframe.addEventListener('load', onReady, { once: true });
      }
    });
    observer.observe(container, { childList: true, subtree: true });

    const script = document.createElement('script');
    script.src   = 'https://form.jotform.com/jsform/261262448371659';
    script.async = true;
    container.appendChild(script);
  }

  function showFormOverlay() {
    startFormLoad();
    if (formReady || dismissOverlay) return;

    const container = document.getElementById('contato-form-container');
    container.style.minHeight = '520px';

    const overlay = document.createElement('div');
    overlay.className = 'form-loading-overlay';
    container.appendChild(overlay);

    dismissOverlay = () => {
      overlay.classList.add('done');
      overlay.addEventListener('transitionend', () => {
        overlay.remove();
        container.style.minHeight = '';
      }, { once: true });
    };
  }

  window.addEventListener('load', startFormLoad);

  // ── Navigation ──────────────────────────────────────────────────────────────
  function goHome() {
    navItems.forEach(i => { i.classList.remove('selected'); i.removeAttribute('aria-current'); });
    sections.forEach(s => { s.hidden = true; });
    heroEls.forEach(el => el.classList.remove('small'));
    homeItem.classList.add('selected');
    homeItem.setAttribute('aria-current', 'page');
  }

  function navigateTo(name, pushState = true) {
    if (!name || name === 'home') {
      if (pushState) history.pushState(null, '', location.pathname);
      goHome();
      return;
    }

    const section = document.getElementById(`section-${name}`);
    if (!section) return;

    navItems.forEach(i => { i.classList.remove('selected'); i.removeAttribute('aria-current'); });
    sections.forEach(s => { s.hidden = true; });

    const item = document.querySelector(`.nav-item[data-section="${name}"]`);
    item?.classList.add('selected');
    item?.setAttribute('aria-current', 'page');

    section.hidden = false;
    section.scrollTop = 0;
    if (name === 'contato') showFormOverlay();

    const heading = section.querySelector('h1, h2, h3');
    if (heading) { heading.tabIndex = -1; heading.focus(); }

    heroEls.forEach(el => el.classList.add('small'));
    if (pushState) history.pushState(null, '', `#${name}`);
  }

  // ── Init ────────────────────────────────────────────────────────────────────
  navItems.forEach(item => item.addEventListener('click', e => {
    e.preventDefault();
    navigateTo(item.dataset.section);
  }));

  window.addEventListener('popstate', () => {
    navigateTo(location.hash.replace('#', '') || 'home', false);
  });

  const initialHash = location.hash.replace('#', '');
  if (initialHash && initialHash !== 'home') {
    navigateTo(initialHash, false);
    document.documentElement.classList.remove('has-hash');
  }

  casesTabs.forEach(tab => tab.addEventListener('click', () => {
    casesTabs.forEach(t => t.classList.remove('selected'));
    tab.classList.add('selected');
  }));

  // ── Scroll-to-next-section ────────────────────────────────────────────────
  const sectionOrder = ['home', 'portfolio', 'sobre', 'contato'];
  let navCooldown  = false;
  let lastWheelTime = 0;

  function getActiveSectionName() {
    for (const s of sections) {
      if (!s.hidden) return s.id.replace('section-', '');
    }
    return 'home';
  }

  function tryNavigate(direction) {
    if (navCooldown) return false;
    const current = getActiveSectionName();
    const idx = sectionOrder.indexOf(current);
    const next = idx + direction;
    if (next < 0 || next >= sectionOrder.length) return false;
    navCooldown = true;
    setTimeout(() => { navCooldown = false; }, 900);
    const target = sectionOrder[next];
    navigateTo(target);
    // Backward nav: land at bottom so the user can scroll up naturally
    if (direction < 0 && target !== 'home') {
      const el = document.getElementById(`section-${target}`);
      if (el) el.scrollTop = el.scrollHeight;
    }
    return true;
  }

  sections.forEach(section => {
    // Desktop wheel
    section.addEventListener('wheel', e => {
      const now      = Date.now();
      const atBottom = section.scrollHeight - section.scrollTop - section.clientHeight <= 4;
      const atTop    = section.scrollTop <= 0;

      if (e.deltaY > 0 && atBottom) {
        const idle = now - lastWheelTime > 80;
        lastWheelTime = now;
        if (idle && tryNavigate(1)) e.preventDefault();
      } else if (e.deltaY < 0 && atTop) {
        const idle = now - lastWheelTime > 80;
        lastWheelTime = now;
        if (idle && tryNavigate(-1)) e.preventDefault();
      } else {
        lastWheelTime = now;
      }
    }, { passive: false });

    // Mobile touch
    let touchStartY      = 0;
    let touchStartScroll = 0;
    section.addEventListener('touchstart', e => {
      touchStartY      = e.touches[0].clientY;
      touchStartScroll = section.scrollTop;
    }, { passive: true });
    section.addEventListener('touchend', e => {
      const dy       = touchStartY - e.changedTouches[0].clientY;
      const atBottom = section.scrollHeight - section.scrollTop - section.clientHeight <= 4;
      const atTop    = section.scrollTop <= 0;
      // Only fire when the gesture started at the boundary
      if (dy > 40 && atBottom && touchStartScroll >= section.scrollHeight - section.clientHeight - 4) {
        tryNavigate(1);
      } else if (dy < -40 && atTop && touchStartScroll <= 0) {
        tryNavigate(-1);
      }
    }, { passive: true });
  });

  // Home screen: wheel down → portfolio
  window.addEventListener('wheel', e => {
    if (getActiveSectionName() !== 'home') return;
    if (e.deltaY > 0) {
      const now  = Date.now();
      const idle = now - lastWheelTime > 80;
      lastWheelTime = now;
      if (idle) tryNavigate(1);
    }
  }, { passive: true });

  // Home screen: swipe up → portfolio
  let homeTouchY = 0;
  window.addEventListener('touchstart', e => {
    if (getActiveSectionName() !== 'home') return;
    homeTouchY = e.touches[0].clientY;
  }, { passive: true });
  window.addEventListener('touchend', e => {
    if (getActiveSectionName() !== 'home') return;
    if (homeTouchY - e.changedTouches[0].clientY > 40) tryNavigate(1);
  }, { passive: true });
})();
