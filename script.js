const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* split hero title into masked words */
$$('.split').forEach(el => {
  let i = 0;
  const walk = node => [...node.childNodes].forEach(n => {
    if (n.nodeType === 3) {
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(part => {
        if (!part.trim()) { frag.append(part); return; }
        const w = document.createElement('span'); w.className = 'w';
        const s = document.createElement('span'); s.textContent = part;
        s.style.transitionDelay = (i++ * 90 + 200) + 'ms';
        w.append(s); frag.append(w);
      });
      n.replaceWith(frag);
    } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
  });
  walk(el);
});

addEventListener('load', () => document.documentElement.classList.add('loaded'));
setTimeout(() => document.documentElement.classList.add('loaded'), 2500);

/* nav: hide on scroll down, show on scroll up */
const nav = $('#nav');
let lastY = 0;
addEventListener('scroll', () => {
  const y = scrollY;
  nav.classList.toggle('shadow', y > 20);
  nav.classList.toggle('hide', y > lastY && y > 300 && !$('#menu').classList.contains('open'));
  lastY = y;
}, { passive: true });

const menu = $('#menu'), burger = $('#burger');
burger.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
  document.body.classList.toggle('locked', open);
});
menu.addEventListener('click', e => {
  if (e.target.closest('a')) {
    menu.classList.remove('open'); burger.setAttribute('aria-expanded', false);
    document.body.classList.remove('locked');
  }
});

/* hero slideshow */
const slides = $$('.slide'), bar = $('#bar'), cap = $('#cap'), idx = $('#idx');
const DUR = 6000;
let cur = 0, t0 = performance.now();
const show = n => {
  slides[cur].classList.remove('active');
  cur = (n + slides.length) % slides.length;
  slides[cur].classList.add('active');
  cap.textContent = slides[cur].dataset.cap;
  idx.textContent = String(cur + 1).padStart(2, '0');
  t0 = performance.now();
};
if (!reduced) {
  const tick = now => {
    const p = Math.min((now - t0) / DUR, 1);
    bar.style.transform = `scaleX(${p})`;
    if (p >= 1) show(cur + 1);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
$('#slider').addEventListener('click', () => show(cur + 1));

/* reveal on scroll */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
$$('.reveal').forEach(el => {
  const sibs = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
  el.style.transitionDelay = sibs.indexOf(el) * 90 + 'ms';
  io.observe(el);
});

/* expertises: floating image preview following the cursor */
const peek = $('#peek'), peekImg = $('img', peek);
let px = 0, py = 0, tx = 0, ty = 0;
$$('#xp li').forEach(li => {
  li.addEventListener('mouseenter', () => { peekImg.src = li.dataset.img; peek.classList.add('on'); });
  li.addEventListener('mouseleave', () => peek.classList.remove('on'));
});
addEventListener('mousemove', e => { tx = e.clientX + 170; ty = e.clientY; });
(function follow() {
  px += (tx - px) * .14; py += (ty - py) * .14;
  peek.style.left = px + 'px'; peek.style.top = py + 'px';
  requestAnimationFrame(follow);
})();

/* portfolio: vertical scroll drives horizontal track (desktop) */
const hs = $('#portfolio'), track = $('#track');
const desktop = matchMedia('(min-width: 861px)');
const sizeHs = () => {
  if (!desktop.matches) { hs.style.height = ''; return; }
  const extra = track.scrollWidth - innerWidth;
  hs.style.height = (innerHeight + Math.max(extra, 0)) + 'px';
};
const moveHs = () => {
  if (!desktop.matches) return;
  const r = hs.getBoundingClientRect();
  const max = track.scrollWidth - innerWidth;
  const p = Math.min(Math.max(-r.top / (hs.offsetHeight - innerHeight || 1), 0), 1);
  track.style.transform = `translate3d(${-p * max}px,0,0)`;
};
addEventListener('resize', () => { sizeHs(); moveHs(); });
addEventListener('scroll', moveHs, { passive: true });
addEventListener('load', () => { sizeHs(); moveHs(); });
sizeHs();

/* lightbox */
const lb = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
$$('.work').forEach(w => w.addEventListener('click', () => {
  lbImg.src = w.dataset.full;
  lbImg.alt = $('img', w).alt;
  lbCap.textContent = $('figcaption', w).childNodes[1].textContent.trim();
  lb.hidden = false; document.body.classList.add('locked');
}));
const closeLb = () => { lb.hidden = true; document.body.classList.remove('locked'); };
$('#lbClose').addEventListener('click', closeLb);
lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
addEventListener('keydown', e => { if (e.key === 'Escape' && !lb.hidden) closeLb(); });

/* footer year + contact form -> mailto */
$('#y').textContent = new Date().getFullYear();
const form = $('#form');
const summary = f => `Nom : ${f.get('nom')}\nOrganisation : ${f.get('org') || '—'}\nEmail : ${f.get('email')}\nType de projet : ${f.get('type')}\n\n${f.get('msg')}`;
form.addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(form);
  location.href = 'mailto:pimentprod228@gmail.com?subject=' +
    encodeURIComponent(`Demande de projet — ${f.get('type')}`) + '&body=' + encodeURIComponent(summary(f));
});
$('#waSend').addEventListener('click', () => {
  if (!form.reportValidity()) return;
  const text = `Bonjour Piment Production,\n\n${summary(new FormData(form))}`;
  window.open('https://wa.me/22890772020?text=' + encodeURIComponent(text), '_blank', 'noopener');
});
