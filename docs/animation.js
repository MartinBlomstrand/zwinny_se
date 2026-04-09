(() => {
  const orbs = document.querySelectorAll('.liquid-orb');
  const logo = document.getElementById('logo');
  let mouseX = -9999, mouseY = -9999;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // ── Subtle orb parallax ──
  function animateOrbs() {
    const cx = mouseX / window.innerWidth - 0.5;
    const cy = mouseY / window.innerHeight - 0.5;
    orbs.forEach((orb, i) => {
      const speed = (i + 1) * 8;
      orb.style.marginLeft = cx * speed + 'px';
      orb.style.marginTop = cy * speed + 'px';
    });
    requestAnimationFrame(animateOrbs);
  }
  animateOrbs();

  // ── Tagline phrases ──
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

  // ── Typewriter ──
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
      const cursor = element.querySelector('.cursor');
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

    await new Promise(r => setTimeout(r, 300));
    logo.classList.add('visible');

    await new Promise(r => setTimeout(r, 1400));
    await typeWriter(tagline, phrases[0]);

    await new Promise(r => setTimeout(r, 300));
    document.getElementById('divider').classList.add('visible');

    await new Promise(r => setTimeout(r, 400));
    document.getElementById('contact').classList.add('visible');

    await new Promise(r => setTimeout(r, 300));
    document.getElementById('footer').classList.add('visible');

    rotatePhrases(tagline);
  }
  startSequence();

  // ── Subtle hero parallax ──
  const hero = document.querySelector('.hero');
  document.addEventListener('mousemove', e => {
    const x = (e.clientX / window.innerWidth - 0.5) * 5;
    const y = (e.clientY / window.innerHeight - 0.5) * 5;
    hero.style.transform = `translate(${x}px, ${y}px)`;
  });
})();
