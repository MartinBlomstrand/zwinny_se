(() => {
  const canvas = document.getElementById('stage');
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let W = 0, H = 0;
  let particles = [];

  // 'particles' → settled → 'fade' (crossfade to whole logo) → 'whole'
  // click on whole logo bursts it back to 'particles'
  let mode = 'particles';
  let fadeT = 0;
  let sinceBurst = 0;
  let logoBox = { x: 0, y: 0, w: 0, h: 0 };

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  // ── Sample logo pixels into particle targets ──
  const logoImg = new Image();
  // rAF pauses in hidden tabs — fall back to setTimeout so the
  // animation state keeps advancing (e.g. preview/screenshot tools)
  function schedule(fn) {
    if (document.hidden) setTimeout(fn, 1000 / 60);
    else requestAnimationFrame(fn);
  }

  let started = false;
  function init() {
    if (started) return;
    started = true;
    buildParticles();
    schedule(tick);
    startSequence();
  }
  logoImg.onload = init;
  logoImg.src = 'assets/logo.svg';
  // cached images can complete before onload is honored in some engines
  if (logoImg.complete && logoImg.naturalWidth) init();

  // debug hook (harmless in production)
  let frozen = false;
  window.__zwinny = {
    set freeze(v) { frozen = v; },
    get particleCount() { return particles.length; },
    get frame() { return frame; },
    get imgComplete() { return logoImg.complete; },
    get mode() { return mode; },
    step(n) { for (let i = 0; i < n; i++) step(); draw(); }
  };

  function buildParticles() {
    const logoW = Math.min(560, W * 0.8);
    const scale = logoW / logoImg.width;
    const logoH = logoImg.height * scale;
    const offX = (W - logoW) / 2;
    const offY = H * 0.38 - logoH / 2;
    logoBox = { x: offX, y: offY, w: logoW, h: logoH };

    const off = document.createElement('canvas');
    off.width = Math.ceil(logoW);
    off.height = Math.ceil(logoH);
    const octx = off.getContext('2d');
    octx.drawImage(logoImg, 0, 0, off.width, off.height);
    const data = octx.getImageData(0, 0, off.width, off.height).data;

    const gap = Math.max(2, Math.round(logoW / 280));
    particles = [];
    for (let y = 0; y < off.height; y += gap) {
      for (let x = 0; x < off.width; x += gap) {
        const alpha = data[(y * off.width + x) * 4 + 3];
        if (alpha > 128) {
          // spawn far beyond the screen edges — the logo is drawn
          // together from the whole screen
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.max(W, H) * (0.55 + Math.random() * 0.55);
          particles.push({
            x: W / 2 + Math.cos(angle) * dist,
            y: H / 2 + Math.sin(angle) * dist,
            vx: 0, vy: 0,
            tx: offX + x,
            ty: offY + y,
            size: 0.8 + Math.random() * 0.9,
            delay: Math.random() * 70,
            alpha: 0.85 + Math.random() * 0.15
          });
        }
      }
    }
  }

  // ── Physics ──
  // Fixed-step simulation driven by wall clock, so the animation
  // advances in real time even when ticks are throttled (hidden tab).
  const STEP = 1000 / 60;
  let frame = 0;
  let lastTime = 0;
  let acc = 0;

  function isSettled() {
    let sum = 0, n = 0;
    for (let i = 0; i < particles.length; i += 7) {
      const p = particles[i];
      const dx = p.x - p.tx, dy = p.y - p.ty;
      sum += dx * dx + dy * dy;
      n++;
    }
    return n === 0 || sum / n < 1.2;
  }

  function step() {
    frame++;
    sinceBurst++;
    if (mode === 'whole') return;

    const spring = 0.005;    // pull toward target — low = slow, floaty return
    const damping = 0.93;    // high = particles glide farther before settling

    for (const p of particles) {
      if (frame < p.delay) continue;

      // spring toward target — nothing interferes, so the logo
      // always reassembles no matter where the mouse rests
      p.vx += (p.tx - p.x) * spring;
      p.vy += (p.ty - p.y) * spring;

      p.vx *= damping;
      p.vy *= damping;
      p.x += p.vx;
      p.y += p.vy;
    }

    if (mode === 'particles' && sinceBurst > 60 && frame % 12 === 0 && isSettled()) {
      mode = 'fade';
      fadeT = 0;
    } else if (mode === 'fade') {
      fadeT += 0.022;
      if (fadeT >= 1) { fadeT = 1; mode = 'whole'; }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    if (mode !== 'whole') {
      const fade = mode === 'fade' ? 1 - fadeT : 1;
      ctx.fillStyle = '#ffffff';
      for (const p of particles) {
        if (frame < p.delay) continue;
        ctx.globalAlpha = p.alpha * fade;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }

    if (mode === 'fade' || mode === 'whole') {
      ctx.globalAlpha = mode === 'whole' ? 1 : fadeT;
      ctx.drawImage(logoImg, logoBox.x, logoBox.y, logoBox.w, logoBox.h);
    }
    ctx.globalAlpha = 1;
  }

  function tick() {
    const now = performance.now();
    if (!lastTime) lastTime = now;
    acc += now - lastTime;
    lastTime = now;

    // cap catch-up work to avoid huge bursts after long pauses
    let steps = Math.min(Math.floor(acc / STEP), 120);
    acc = Math.min(acc - steps * STEP, STEP * 120);
    if (frozen) steps = 0;
    while (steps-- > 0) step();

    draw();
    schedule(tick);
  }

  // ── Interaction ──
  function overLogo(x, y) {
    const pad = 10;
    return x > logoBox.x - pad && x < logoBox.x + logoBox.w + pad &&
           y > logoBox.y - pad && y < logoBox.y + logoBox.h + pad;
  }

  function explode(x, y) {
    mode = 'particles';
    fadeT = 0;
    sinceBurst = 0;
    burst(x, y);
  }

  // only the pointer cursor invites interaction — explosion is click-only
  document.addEventListener('mousemove', e => {
    canvas.style.cursor = overLogo(e.clientX, e.clientY) ? 'pointer' : 'default';
  });

  function burst(cx, cy) {
    // strong enough to send every particle toward the screen edges
    // before the spring sucks them back into the logo
    // (scaled to the lower drag so reach stays about one screen)
    const base = Math.max(W, H) / 14;
    for (const p of particles) {
      const dx = p.x - cx;
      const dy = p.y - cy;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const jitter = (Math.random() - 0.5) * 0.6;
      const cosJ = Math.cos(jitter), sinJ = Math.sin(jitter);
      const nx = (dx / d) * cosJ - (dy / d) * sinJ;
      const ny = (dx / d) * sinJ + (dy / d) * cosJ;
      const falloff = Math.max(0.45, Math.min(220 / d, 1));
      const f = base * falloff * (0.55 + Math.random() * 0.9);
      p.vx += nx * f;
      p.vy += ny * f;
    }
  }

  canvas.addEventListener('click', e => explode(e.clientX, e.clientY));

  window.addEventListener('resize', () => {
    resize();
    if (logoImg.complete) {
      mode = 'particles';
      fadeT = 0;
      sinceBurst = 0;
      const old = particles;
      buildParticles();
      // keep current positions for a smooth reflow
      for (let i = 0; i < particles.length && i < old.length; i++) {
        particles[i].x = old[i].x;
        particles[i].y = old[i].y;
        particles[i].delay = 0;
      }
    }
  });

  // ── Tagline ──
  const phrases = [
    'For the love of creating',
    'For the love of building',
    'For the love of solving',
    'For the love of simplicity',
    'For the love of speed',
    'For the love of great products',
    'For the love of automation',
    'For the love of AI',
    'For the love of progress'
  ];
  let phraseIndex = 0;

  function typeWriter(element, text, speed = 60) {
    return new Promise(resolve => {
      element.classList.add('typing');
      let cursor = element.querySelector('.cursor');
      if (!cursor) {
        cursor = document.createElement('span');
        cursor.className = 'cursor';
        element.appendChild(cursor);
      }
      let i = 0;
      function type() {
        if (i < text.length) {
          element.insertBefore(document.createTextNode(text.charAt(i)), cursor);
          i++;
          setTimeout(type, speed + Math.random() * 40);
        } else {
          resolve();
        }
      }
      type();
    });
  }

  function eraseText(element, speed = 30) {
    return new Promise(resolve => {
      const textNodes = Array.from(element.childNodes).filter(n => n.nodeType === 3);
      let total = textNodes.reduce((sum, n) => sum + n.textContent.length, 0);
      function erase() {
        if (total > 0) {
          const last = textNodes[textNodes.length - 1];
          last.textContent = last.textContent.slice(0, -1);
          if (last.textContent.length === 0) textNodes.pop();
          total--;
          setTimeout(erase, speed + Math.random() * 20);
        } else {
          resolve();
        }
      }
      erase();
    });
  }

  async function rotatePhrases(element) {
    while (true) {
      await new Promise(r => setTimeout(r, 3000));
      await eraseText(element);
      await new Promise(r => setTimeout(r, 400));
      phraseIndex = (phraseIndex + 1) % phrases.length;
      await typeWriter(element, phrases[phraseIndex]);
    }
  }

  // ── Sequence ──
  async function startSequence() {
    const tagline = document.getElementById('tagline');

    await new Promise(r => setTimeout(r, 2200));
    await typeWriter(tagline, phrases[0]);

    await new Promise(r => setTimeout(r, 300));
    document.getElementById('divider').classList.add('visible');

    await new Promise(r => setTimeout(r, 400));
    document.getElementById('contact').classList.add('visible');

    await new Promise(r => setTimeout(r, 300));
    document.getElementById('footer').classList.add('visible');

    rotatePhrases(tagline);
  }
})();
