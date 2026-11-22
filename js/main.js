// ── App ───────────────────────────────────────────────────────────────────────
(() => {
  // ── Contact form ────────────────────────────────────────────────────────────
  const CONTATO_URL = 'https://contato.broadcatz-web.workers.dev/api/contato';
  const CONTATO_MSG = {
    400: ['Dados inválidos', 'Alguns campos não foram aceitos. Confira os campos e tente de novo.'],
    403: ['Verificação não confirmada', 'Não conseguimos confirmar a verificação anti-robô. Tente de novo.'],
    413: ['Mensagem grande demais', 'O texto passou do tamanho aceito (3.000 caracteres). Reduza a mensagem e envie de novo.'],
    429: ['Muitas tentativas', 'Recebemos muitas tentativas em pouco tempo. Aguarde um minuto e tente de novo.'],
    502: ['Não foi possível enviar', 'Não conseguimos entregar sua mensagem agora. Tente de novo em instantes ou use os links da equipe nesta página.']
  };
  const CONTATO_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const CONTATO_LABEL = { nome: 'nome', email: 'e-mail', telefone: 'telefone', mensagem: 'mensagem' };
  const CONTATO_TEL_RE = /^\+?[\d\s().-]{8,30}$/;

  function initContato() {
    const form = document.getElementById('contato-form');
    if (!form) return;
    const fields = {
      nome: form.elements.nome,
      email: form.elements.email,
      telefone: form.elements.telefone,
      mensagem: form.elements.mensagem
    };
    const website = form.elements.website;
    const fieldset = document.getElementById('contato-campos');
    const status = document.getElementById('contato-status');
    const alertBox = document.getElementById('contato-alert');
    const btn = document.getElementById('contato-enviar');
    const success = document.getElementById('contato-sucesso');
    const tsEl = document.getElementById('cf-turnstile');
    const btnLabel = btn.textContent;
    const touched = {};
    let submitted = false;
    let sending = false;

    // Turnstile renders itself from the data- attributes (api.js is async, so no
    // callbacks are wired: the token is read from the widget's hidden input).
    function readToken() {
      const input = form.querySelector('[name="cf-turnstile-response"]');
      return input && input.value ? input.value : null;
    }

    function resetTs() {
      if (window.turnstile) {
        try { window.turnstile.reset(tsEl); } catch (e) { /* widget not ready */ }
      }
    }

    function validate() {
      const errs = {};
      if (!fields.nome.value.trim()) errs.nome = 'Informe seu nome.';
      const email = fields.email.value.trim();
      if (!email) errs.email = 'Informe seu e-mail.';
      else if (!CONTATO_EMAIL_RE.test(email)) errs.email = 'Esse e-mail parece incompleto.\nExemplo: nome@empresa.com.br';
      const tel = fields.telefone.value.trim();
      if (tel && !CONTATO_TEL_RE.test(tel)) errs.telefone = 'Confira o telefone: use só números, com DDD.\nExemplo: (11) 91234-5678';
      if (!fields.mensagem.value.trim()) errs.mensagem = 'Escreva sua mensagem.';
      return errs;
    }

    function setErr(key, msg) {
      form.querySelectorAll('[data-err="' + key + '"]').forEach(e => { e.textContent = msg || ''; });
      const f = fields[key];
      if (f) {
        if (msg) f.setAttribute('aria-invalid', 'true');
        else f.removeAttribute('aria-invalid');
      }
    }

    function count(key) {
      const c = form.querySelector('[data-cnt="' + key + '"]');
      if (c) c.textContent = fields[key].value.length + '/' + fields[key].maxLength;
    }

    function revalidate(key) {
      setErr(key, validate()[key]);
    }

    Object.keys(fields).forEach(key => {
      fields[key].addEventListener('input', () => {
        count(key);
        if (submitted || touched[key]) revalidate(key);
      });
      fields[key].addEventListener('blur', () => {
        if (fields[key].value || touched[key]) {
          touched[key] = true;
          revalidate(key);
        }
      });
    });

    function setSending(on) {
      sending = on;
      fieldset.disabled = on;
      btn.disabled = on;
      form.setAttribute('aria-busy', on ? 'true' : 'false');
      if (on) {
        btn.textContent = 'Enviando';
        const dots = document.createElement('span');
        dots.className = 'cf-dots';
        dots.setAttribute('aria-hidden', 'true');
        dots.innerHTML = '<i></i><i></i><i></i>';
        btn.appendChild(dots);
        alertBox.textContent = '';
        status.textContent = 'Enviando mensagem.';
      } else {
        btn.textContent = btnLabel;
      }
    }

    function showServerError(code) {
      setSending(false);
      const m = CONTATO_MSG[code] || CONTATO_MSG[502];
      alertBox.textContent = '';
      const title = document.createElement('strong');
      title.textContent = m[0];
      alertBox.append(title, m[1]);
      status.textContent = '';
      btn.focus();
    }

    function showSuccess(values) {
      setSending(false);
      success.querySelectorAll('[data-echo]').forEach(e => { e.textContent = values[e.dataset.echo]; });
      success.querySelectorAll('[data-echo-row]').forEach(r => { r.hidden = !values[r.dataset.echoRow]; });
      form.hidden = true;
      success.hidden = false;
      status.textContent = '';
      document.getElementById('contato-sucesso-h').focus();
    }

    function resetForm() {
      form.reset();
      Object.keys(fields).forEach(count);
      Object.keys(touched).forEach(k => delete touched[k]);
      submitted = false;
      ['nome', 'email', 'telefone', 'mensagem', 'ts'].forEach(k => setErr(k, ''));
      alertBox.textContent = '';
      status.textContent = '';
      resetTs();
      success.hidden = true;
      form.hidden = false;
      fields.nome.focus();
    }

    // Keep focus in the field on mouse press, so its blur validation can't
    // shift the layout between mousedown and mouseup and swallow the click.
    btn.addEventListener('mousedown', e => e.preventDefault());

    document.getElementById('contato-outra').addEventListener('click', resetForm);

    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (sending) return;
      const errs = validate();
      const keys = Object.keys(errs);
      submitted = true;
      ['nome', 'email', 'telefone', 'mensagem'].forEach(k => setErr(k, errs[k]));
      if (keys.length) {
        status.textContent = keys.length + (keys.length === 1 ? ' campo precisa' : ' campos precisam') +
          ' de ajuste: ' + keys.map(k => CONTATO_LABEL[k]).join(', ') + '.';
        fields[keys[0]].focus();
        return;
      }
      const t = readToken();
      if (!t) {
        setErr('ts', 'Aguarde a verificação terminar e tente de novo.');
        status.textContent = 'Verificação pendente.';
        return;
      }
      setErr('ts', '');
      const payload = {
        nome: fields.nome.value.trim(),
        email: fields.email.value.trim(),
        telefone: fields.telefone.value.trim(),
        mensagem: fields.mensagem.value.trim(),
        website: website.value,
        turnstileToken: t
      };
      setSending(true);
      let code = 502;
      try {
        const res = await fetch(CONTATO_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        let body = null;
        try { body = await res.json(); } catch (err) { /* non-JSON body */ }
        code = res.status === 200 && body && body.ok === true ? 200 : res.status;
      } catch (err) {
        code = 502; // network error
      }
      resetTs(); // tokens are single use: refresh after every attempt
      if (code === 200) showSuccess(payload);
      else showServerError(code);
    });
  }

  initContato();

  // ── Cat ears: progressive scroll animation ───────────────────────────────
  let _homeSection, _ears;

  function updateEars() {
    _homeSection ??= document.getElementById('home');
    _ears ??= document.querySelector('.ears');
    if (!_homeSection || !_ears) return;
    const homeH = _homeSection.offsetHeight;
    if (!homeH) return;
    const progress = Math.min(1, window.scrollY / homeH);
    const opacity = 1 - progress;
    const scale = 1 - progress * 0.55;

    _ears.style.opacity = opacity;
    _ears.style.transform = window.innerWidth <= 720
      ? `translateX(-50%) scale(${scale})`
      : `scale(${scale})`;
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

  // ── Hero background: pause the VHS animations while the hero is off screen ──
  const homeEl = document.getElementById('home');
  if (homeEl) {
    new IntersectionObserver(([e]) => homeEl.classList.toggle('is-offscreen', !e.isIntersecting)).observe(homeEl);
  }

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
  });
})();
