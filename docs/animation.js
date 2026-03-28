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

  // ── Typewriter ──
  function typeWriter(element, text, speed = 60) {
    return new Promise(resolve => {
      element.classList.add('typing');
      const cursor = document.createElement('span');
      cursor.className = 'cursor';
      element.appendChild(cursor);
      let i = 0;
      function type() {
        if (i < text.length) {
          element.insertBefore(document.createTextNode(text.charAt(i)), cursor);
          i++;
          setTimeout(type, speed + Math.random() * 40);
        } else {
          setTimeout(() => {
            cursor.animate([{ opacity: 1 }, { opacity: 0 }], {
              duration: 400, fill: 'forwards'
            }).onfinish = () => cursor.remove();
            resolve();
          }, 1200);
        }
      }
      type();
    });
  }

  // ── Sequence ──
  async function startSequence() {
    await new Promise(r => setTimeout(r, 300));
    logo.classList.add('visible');

    await new Promise(r => setTimeout(r, 1400));
    await typeWriter(document.getElementById('tagline'), 'The love of creating');

    await new Promise(r => setTimeout(r, 300));
    document.getElementById('divider').classList.add('visible');

    await new Promise(r => setTimeout(r, 400));
    document.getElementById('contact').classList.add('visible');

    await new Promise(r => setTimeout(r, 300));
    document.getElementById('footer').classList.add('visible');
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
