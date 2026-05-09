// ── Cursor glow ──────────────────────────────────────────────────────────────
(() => {
  const canvas = document.getElementById('cursor-glow');
  const ctx = canvas.getContext('2d');

  const SPACING = 56;
  const RADIUS = 520;
  const LINE_ALPHA = 0.22;
  const HALO_ALPHA = 0.32;

  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let W = 0, H = 0;
  let mouseX = -99999, mouseY = -99999;
  let smX = -99999, smY = -99999;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
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
      halo.addColorStop(0, `rgba(255, 90, 138, ${HALO_ALPHA})`);
      halo.addColorStop(0.30, `rgba(255, 90, 138, ${HALO_ALPHA * 0.45})`);
      halo.addColorStop(0.65, `rgba(255, 90, 138, ${HALO_ALPHA * 0.15})`);
      halo.addColorStop(1, 'rgba(255, 90, 138, 0)');
      ctx.fillStyle = halo;
      ctx.fillRect(smX - RADIUS, smY - RADIUS, RADIUS * 2, RADIUS * 2);

      ctx.save();
      ctx.strokeStyle = `rgba(255, 90, 138, ${LINE_ALPHA})`;
      ctx.lineWidth = 1;

      const minX = Math.floor((smX - RADIUS) / SPACING) * SPACING;
      const maxX = Math.ceil((smX + RADIUS) / SPACING) * SPACING;
      const minY = Math.floor((smY - RADIUS) / SPACING) * SPACING;
      const maxY = Math.ceil((smY + RADIUS) / SPACING) * SPACING;

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
      mask.addColorStop(0, 'rgba(0,0,0,1)');
      mask.addColorStop(0.30, 'rgba(0,0,0,0.55)');
      mask.addColorStop(0.65, 'rgba(0,0,0,0.20)');
      mask.addColorStop(1, 'rgba(0,0,0,0)');
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
  // ── Contact form ────────────────────────────────────────────────────────────
  let formStarted = false;
  let formReady = false;
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
    script.src = 'https://form.jotform.com/jsform/261262448371659';
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

  if (document.readyState === 'complete') startFormLoad();
  else window.addEventListener('load', startFormLoad);

  // ── Cat ears: progressive scroll animation ───────────────────────────────
  let _homeSection, _ears, _earWash;

  function updateEars() {
    _homeSection ??= document.getElementById('home');
    _ears ??= document.querySelector('.ears');
    _earWash ??= document.querySelector('.ear-wash');
    if (!_homeSection || !_ears || !_earWash) return;
    const homeH = _homeSection.offsetHeight;
    if (!homeH) return;
    const progress = Math.min(1, window.scrollY / homeH);
    const opacity = 1 - progress;
    const scale = 1 - progress * 0.55;

    _ears.style.opacity = opacity;
    _ears.style.transform = window.innerWidth <= 720
      ? `translateX(-50%) scale(${scale})`
      : `scale(${scale})`;

    _earWash.style.opacity = opacity;
  }

  let earsTicking = false;
  function scheduleEarsUpdate() {
    if (earsTicking) return;
    earsTicking = true;
    requestAnimationFrame(() => { updateEars(); earsTicking = false; });
  }
  window.addEventListener('scroll', scheduleEarsUpdate, { passive: true });
  window.addEventListener('resize', scheduleEarsUpdate, { passive: true });
  requestAnimationFrame(updateEars);

  // Defer DOM-dependent setup to first rAF so async script never races the parser
  requestAnimationFrame(() => {
    // ── Active nav via IntersectionObserver ────────────────────────────────
    const navItems = document.querySelectorAll('.nav-item');

    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const name = entry.target.id;
        navItems.forEach(i => {
          const active = i.dataset.section === name;
          i.classList.toggle('selected', active);
          if (active) {
            i.setAttribute('aria-current', 'page');
          } else {
            i.removeAttribute('aria-current');
          }
        });
      });
    }, { rootMargin: '-45% 0px -45% 0px' });

    document.querySelectorAll('.page-section, #home')
      .forEach(s => navObserver.observe(s));

    // ── Trigger form overlay when contato scrolls into view ────────────────
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) showFormOverlay();
    }, { threshold: 0.1 })
      .observe(document.getElementById('contato'));
  });
})();
