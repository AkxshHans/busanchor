// ---------- Nav scroll state ----------
const nav = document.getElementById('nav');
if(nav){
  const onScroll = () => {
    if(window.scrollY > 40){ nav.classList.add('scrolled'); }
    else{ nav.classList.remove('scrolled'); }
  };
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();
}

// ---------- Mobile menu ----------
const hamburger = document.getElementById('hamburger');
const mobilePanel = document.getElementById('mobilePanel');
const scrim = document.getElementById('scrim');
if(hamburger && mobilePanel && scrim){
  function closeMenu(){
    hamburger.classList.remove('active');
    mobilePanel.classList.remove('open');
    scrim.classList.remove('open');
    document.body.style.overflow = '';
  }
  function toggleMenu(){
    const opening = !mobilePanel.classList.contains('open');
    hamburger.classList.toggle('active', opening);
    mobilePanel.classList.toggle('open', opening);
    scrim.classList.toggle('open', opening);
    document.body.style.overflow = opening ? 'hidden' : '';
  }
  hamburger.addEventListener('click', toggleMenu);
  scrim.addEventListener('click', closeMenu);
  mobilePanel.querySelectorAll('a, button:not([data-portfolio-popup])').forEach(a => a.addEventListener('click', closeMenu));
}

// ---------- Portfolio nav dropdown (desktop: click "Portfolio" to reveal Website/Logo/Content Creation) ----------
(function(){
  const dropdowns = document.querySelectorAll('.nav-dropdown');
  if(!dropdowns.length) return;
  dropdowns.forEach(dd => {
    const toggle = dd.querySelector('[data-portfolio-toggle]');
    if(!toggle) return;
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      const opening = !dd.classList.contains('open');
      dropdowns.forEach(o => { if(o !== dd) o.classList.remove('open'); });
      dd.classList.toggle('open', opening);
    });
    const closeBtn = dd.querySelector('.nav-dropdown-menu-close');
    if(closeBtn){
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dd.classList.remove('open');
      });
    }
  });
  document.addEventListener('click', (e) => {
    dropdowns.forEach(dd => { if(!dd.contains(e.target)) dd.classList.remove('open'); });
  });
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape'){ dropdowns.forEach(dd => dd.classList.remove('open')); }
  });
})();

// ---------- Portfolio popup (mobile: tapping "Portfolio" opens a popup with Website/Logo/Content Creation) ----------
(function(){
  const popup = document.getElementById('portfolioPopup');
  const triggers = document.querySelectorAll('[data-portfolio-popup]');
  if(!popup || !triggers.length) return;
  let lastFocused = null;
  function closeMobileMenuIfOpen(){
    const h = document.getElementById('hamburger');
    const mp = document.getElementById('mobilePanel');
    const sc = document.getElementById('scrim');
    if(h) h.classList.remove('active');
    if(mp) mp.classList.remove('open');
    if(sc) sc.classList.remove('open');
  }
  function openPopup(e){
    if(e) e.preventDefault();
    closeMobileMenuIfOpen();
    lastFocused = document.activeElement;
    popup.classList.add('open');
    popup.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closePopup(){
    popup.classList.remove('open');
    popup.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if(lastFocused && typeof lastFocused.focus === 'function'){ lastFocused.focus(); }
  }
  triggers.forEach(t => t.addEventListener('click', openPopup));
  popup.querySelectorAll('[data-portfolio-popup-close]').forEach(el => el.addEventListener('click', closePopup));
  popup.querySelectorAll('a').forEach(a => a.addEventListener('click', closePopup));
  document.addEventListener('keydown', (e) => { if(e.key === 'Escape' && popup.classList.contains('open')) closePopup(); });
})();

// ---------- Content Creation videos: autoplay + loop, muted by default, click speaker to toggle sound ----------
(function(){
  document.querySelectorAll('.video-card').forEach(card => {
    const video = card.querySelector('video');
    const btn = card.querySelector('.video-sound-btn');
    if(!video) return;
    initAutoplayVideo(video);
    if(btn){
      btn.addEventListener('click', () => {
        video.muted = !video.muted;
        btn.classList.toggle('unmuted', !video.muted);
        btn.setAttribute('aria-label', video.muted ? 'Unmute video' : 'Mute video');
        if(!video.muted){ video.play().catch(() => {}); }
      });
    }
  });
})();

// ---------- Footer year ----------
document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

// ---------- Contact form: sends every submission straight to FormSubmit.co's
// AJAX endpoint, which emails it to contact@businessanchor.ca. This needs no
// server code, no API key and no environment variables — it works from a
// plain static file host. (A /api/contact.js + Resend backend is still
// included in this package as an optional alternative if you ever want a
// fully custom email template — see that file's comments.) The ONE thing
// that can't be automated: the very first time a submission is sent,
// FormSubmit emails contact@businessanchor.ca asking to confirm ownership
// of that inbox — clicking that one link (once, ever) turns delivery on. ----------
const CONTACT_ENDPOINT = 'https://formsubmit.co/ajax/contact@businessanchor.ca';

document.querySelectorAll('form[data-contact-form]').forEach(form => {
  const note = form.querySelector('.form-note');
  const errorNote = form.querySelector('.form-error');
  const submitBtn = form.querySelector('.submit-btn');
  const honeypot = form.querySelector('input[name="company"]');

  form.addEventListener('submit', function(e){
    e.preventDefault();

    // Honeypot: real visitors never see or fill this field. If it's filled,
    // silently "succeed" without sending anything to avoid tipping off bots.
    if(honeypot && honeypot.value){
      if(note){ note.classList.add('show'); setTimeout(() => note.classList.remove('show'), 4000); }
      form.reset();
      return;
    }

    if(errorNote) errorNote.classList.remove('show');

    const name = form.querySelector('[name="name"]')?.value || '';
    const email = form.querySelector('[name="email"]')?.value || '';
    const phone = form.querySelector('[name="phone"]')?.value || '';
    const message = form.querySelector('[name="message"]')?.value || '';

    const data = {
      name,
      email,
      phone,
      message,
      page: window.location.pathname,
      _subject: `New website inquiry from ${name || 'a visitor'} — Business Anchor`,
      _template: 'table',
      _captcha: 'false'
    };

    const originalBtnText = submitBtn ? submitBtn.textContent : '';
    if(submitBtn){ submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

    fetch(CONTACT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(res => {
        if(!res.ok) throw new Error('Request failed');
        return res.json().catch(() => ({}));
      })
      .then(() => {
        if(note){ note.classList.add('show'); setTimeout(() => note.classList.remove('show'), 6000); }
        form.reset();
      })
      .catch(() => {
        if(errorNote){ errorNote.classList.add('show'); }
      })
      .finally(() => {
        if(submitBtn){ submitBtn.disabled = false; submitBtn.textContent = originalBtnText; }
      });
  });
});

// ---------- Autoplay video helper: robustly starts a muted/looping video even if the
// browser initially blocks autoplay, by retrying on the first user interaction ----------
function initAutoplayVideo(video){
  if(!video) return;
  function tryPlay(){
    const p = video.play();
    if(p && typeof p.catch === 'function'){
      p.catch(() => {
        const resume = () => { video.play(); cleanup(); };
        const cleanup = () => {
          window.removeEventListener('touchstart', resume);
          window.removeEventListener('click', resume);
          window.removeEventListener('scroll', resume);
        };
        window.addEventListener('touchstart', resume, { once:true, passive:true });
        window.addEventListener('click', resume, { once:true });
        window.addEventListener('scroll', resume, { once:true, passive:true });
      });
    }
  }
  video.muted = true;
  video.defaultMuted = true;
  if(video.readyState >= 2){ tryPlay(); }
  else{ video.addEventListener('loadeddata', tryPlay, { once:true }); }
  window.addEventListener('load', tryPlay);
}

// ---------- Hero video (homepage only) ----------
initAutoplayVideo(document.getElementById('heroVideo'));

// ---------- Showcase video (full-screen loop, homepage only) ----------
initAutoplayVideo(document.querySelector('.showcase-video video'));

// ---------- Hero text reveal (no preloader — reveal as soon as the page runs) ----------
(function(){
  const heroAnim = document.querySelector('.hero-anim');
  const heroSection = document.querySelector('.hero');
  if(heroAnim) heroAnim.classList.add('in-view');
  if(heroSection) heroSection.classList.add('in-view');
})();

// ---------- Page 2 cinematic 3D scroll entrance (dual-direction, reversible) ----------
const cineVisuals = document.getElementById('cineVisuals');
if(cineVisuals){
  const desktopCine = window.matchMedia('(min-width:761px)');

  if(desktopCine.matches){
    const section = cineVisuals.closest('.services-banner');
    // Precompute the fx/fy percentage offsets to plain pixels once (and on resize)
    // instead of building nested calc() strings every animation frame.
    const cineItems = Array.from(cineVisuals.querySelectorAll('.cine-item')).map(el => ({
      el,
      fromLeft: el.classList.contains('cine-left'),
      depth: parseFloat(el.dataset.depth) || 1,
      fxPct: parseFloat(el.dataset.fx) || 0,
      fyPct: parseFloat(el.dataset.fy) || 0,
      fxPx: 0,
      fyPx: 0
    }));
    function recalcOffsets(){
      const w = cineVisuals.clientWidth || window.innerWidth;
      const h = cineVisuals.clientHeight || window.innerHeight;
      cineItems.forEach(item => {
        item.fxPx = (item.fxPct / 100) * w;
        item.fyPx = (item.fyPct / 100) * h;
      });
    }
    recalcOffsets();

    let ticking = false;
    let lastProgress = null;
    function updateCine(){
      ticking = false;
      if(!section) return;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress 0 -> section just entering bottom of viewport, 1 -> section top reaches viewport top.
      // This spans the section's entire time on screen, so it keeps changing (and the icons keep
      // visibly moving) for the whole scroll dwell, not just a brief moment at the start.
      let progress = (vh - rect.top) / (vh + rect.height);
      progress = Math.max(0, Math.min(1, progress));
      if(lastProgress !== null && Math.abs(progress - lastProgress) < 0.0008) return;
      lastProgress = progress;

      // Phase 1 (fast, first 35% of the dwell): the 3D fly-in entrance.
      const entrance = Math.min(1, progress / 0.35);
      const eEntrance = 1 - Math.pow(1 - entrance, 3);
      const inv = 1 - eEntrance;
      const scale = (0.7 + eEntrance * 0.3).toFixed(3);
      const opacity = Math.min(1, eEntrance * 1.6).toFixed(3);

      cineItems.forEach(item => {
        const startX = item.fromLeft ? -130 : 130;
        const startRotY = item.fromLeft ? -55 : 55;
        const x = (startX * inv) + (item.fxPx * eEntrance);
        // Phase 2 (whole dwell): a continuous depth-based drift so the icons keep
        // visibly moving relative to each other for as long as the section is on screen.
        const drift = (progress - 0.5) * 140 * item.depth;
        const y = (item.fyPx * eEntrance) + drift;
        const rotY = (startRotY * inv).toFixed(2);
        const z = (-260 * inv).toFixed(1);
        item.el.style.opacity = opacity;
        item.el.style.transform =
          `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z}px) rotateY(${rotY}deg) scale(${scale})`;
      });
    }
    function onScroll(){
      if(!ticking){ requestAnimationFrame(updateCine); ticking = true; }
    }
    window.addEventListener('scroll', onScroll, { passive:true });
    window.addEventListener('resize', () => { recalcOffsets(); onScroll(); });
    updateCine();
  } else {
    // Mobile: lightweight one-time fade/rise reveal, no per-frame scroll work
    if('IntersectionObserver' in window){
      const cineObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if(entry.isIntersecting){
            entry.target.classList.add('cine-in');
            cineObs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.25 });
      cineObs.observe(cineVisuals);
    } else {
      cineVisuals.classList.add('cine-in');
    }
  }
}

// ---------- Services banner: cursor parallax on decorative visuals ----------
const servicesVisuals = document.getElementById('servicesVisuals');
if(servicesVisuals){
  const floatImgs = Array.from(servicesVisuals.querySelectorAll('.visuals-track > .float-img'));
  const desktopParallax = window.matchMedia('(min-width: 761px)');
  const banner = servicesVisuals.closest('.services-banner');
  if(banner && floatImgs.length){
    banner.addEventListener('mousemove', (e) => {
      if(!desktopParallax.matches) return;
      const rect = servicesVisuals.getBoundingClientRect();
      const cx = (e.clientX - rect.left) / rect.width - 0.5;
      const cy = (e.clientY - rect.top) / rect.height - 0.5;
      floatImgs.forEach(el => {
        const depth = parseFloat(el.dataset.depth) || 30;
        el.style.transform = `translate(${(cx*depth).toFixed(1)}px, ${(cy*depth).toFixed(1)}px)`;
      });
    });
    banner.addEventListener('mouseleave', () => {
      floatImgs.forEach(el => { el.style.transform = 'translate(0,0)'; });
    });
  }
}

// ---------- Service cards: 3D scroll reveal + cursor tilt ----------
const serviceCards = document.querySelectorAll('.service-card');
if(serviceCards.length){
  if('IntersectionObserver' in window){
    const cardObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if(entry.isIntersecting){ entry.target.classList.add('in-view'); } });
    }, { threshold: 0.3 });
    serviceCards.forEach(card => cardObserver.observe(card));
  } else {
    serviceCards.forEach(card => card.classList.add('in-view'));
  }
  serviceCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty('--tx', (py * -10).toFixed(2) + 'deg');
      card.style.setProperty('--ty', (px * 10).toFixed(2) + 'deg');
    });
    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--tx', '0deg');
      card.style.setProperty('--ty', '0deg');
    });
  });
}

// ---------- Generic reveal-on-scroll for cards/blocks ----------
const revealEls = document.querySelectorAll('.reveal');
if(revealEls.length && 'IntersectionObserver' in window){
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if(entry.isIntersecting){ entry.target.classList.add('in-view'); revealObserver.unobserve(entry.target); } });
  }, { threshold: 0.2 });
  revealEls.forEach(el => revealObserver.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('in-view'));
}

// ---------- Generic 3D tilt cards (work items, why-cards, detail blocks) ----------
const tiltEls = document.querySelectorAll('.tilt3d');
if(tiltEls.length){
  tiltEls.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty('--tx', (py * -9).toFixed(2) + 'deg');
      el.style.setProperty('--ty', (px * 9).toFixed(2) + 'deg');
    });
    el.addEventListener('mouseleave', () => {
      el.style.setProperty('--tx', '0deg');
      el.style.setProperty('--ty', '0deg');
    });
  });
}

// ---------- Scroll-driven black/grey gradient backdrop ----------
// Any element with [data-zone-top] and [data-zone-bottom] triggers a smooth
// crossfade of a fixed full-page gradient backdrop as it scrolls into view.
(function initScrollGradient(){
  const zones = document.querySelectorAll('[data-zone-top]');
  if(!zones.length) return;

  const wrap = document.createElement('div');
  wrap.className = 'scroll-gradient';
  wrap.setAttribute('aria-hidden', 'true');
  const layerA = document.createElement('div');
  layerA.className = 'sg-layer sg-active';
  const layerB = document.createElement('div');
  layerB.className = 'sg-layer';
  wrap.appendChild(layerA);
  wrap.appendChild(layerB);
  document.body.prepend(wrap);

  let active = layerA, hidden = layerB;

  function setZone(top, bottom){
    const grad = `linear-gradient(180deg, ${top}, ${bottom})`;
    if(hidden.style.background === grad) return;
    hidden.style.background = grad;
    requestAnimationFrame(() => {
      hidden.classList.add('sg-active');
      active.classList.remove('sg-active');
      const tmp = active; active = hidden; hidden = tmp;
    });
  }

  if('IntersectionObserver' in window){
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          setZone(entry.target.dataset.zoneTop, entry.target.dataset.zoneBottom);
        }
      });
    }, { threshold: 0, rootMargin: '-40% 0px -40% 0px' });
    zones.forEach(z => obs.observe(z));
  }
})();

// ---------- FAQ accordion ----------
document.querySelectorAll('.faq-item').forEach(item => {
  const q = item.querySelector('.faq-q');
  const a = item.querySelector('.faq-a');
  if(!q || !a) return;
  q.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(other => {
      if(other !== item){
        other.classList.remove('open');
        other.querySelector('.faq-a').style.maxHeight = null;
      }
    });
    if(isOpen){
      item.classList.remove('open');
      a.style.maxHeight = null;
    } else {
      item.classList.add('open');
      a.style.maxHeight = a.scrollHeight + 'px';
    }
  });
});

// ---------- Cinematic cursor follower (desktop / fine-pointer only) ----------
(function(){
  const fine = window.matchMedia('(min-width:901px) and (pointer:fine)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!fine || reduced) return;

  const cursor = document.createElement('div');
  cursor.className = 'cine-cursor';
  cursor.innerHTML = '<img src="cursor-logo.png" alt="" draggable="false">';
  document.body.appendChild(cursor);

  let active = false;
  let pending = false;
  let mx = 0, my = 0;

  // The cursor's own CSS transition (see .cine-cursor) handles the smooth glide on the
  // GPU compositor, so JS only needs to set the target position once per frame on
  // mousemove — no continuous requestAnimationFrame loop, no manual lerp math, and no
  // stutter from JS trying to out-run the browser's own interpolation.
  function applyPosition(){
    pending = false;
    cursor.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
  }

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    if(!active){
      active = true;
      cursor.classList.add('active');
      cursor.style.transform = `translate3d(${mx}px, ${my}px, 0)`; // snap in instantly, no glide from off-screen
    } else if(!pending){
      pending = true;
      requestAnimationFrame(applyPosition);
    }
  }, { passive:true });

  window.addEventListener('mouseleave', () => { cursor.classList.remove('active'); });
  document.addEventListener('mouseover', (e) => {
    if(e.target.closest('a, button, .btn, input, textarea, select, .work-item, .faq-q, .hamburger, .city-chip, label')){
      cursor.classList.add('hover');
    }
  });
  document.addEventListener('mouseout', (e) => {
    if(e.target.closest('a, button, .btn, input, textarea, select, .work-item, .faq-q, .hamburger, .city-chip, label')){
      cursor.classList.remove('hover');
    }
  });
})();

// ---------- Contact modal (site-wide "Let's Work" style CTAs open a form instead of navigating) ----------
(function(){
  const modal = document.getElementById('contactModal');
  if(!modal) return;
  const triggers = document.querySelectorAll('[data-open-contact]');
  if(!triggers.length) return;

  let lastFocused = null;

  function openModal(e){
    if(e) e.preventDefault();
    lastFocused = document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const firstField = modal.querySelector('input, textarea');
    if(firstField){ setTimeout(() => firstField.focus(), 350); }
  }
  function closeModal(){
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if(lastFocused && typeof lastFocused.focus === 'function'){ lastFocused.focus(); }
  }

  triggers.forEach(a => a.addEventListener('click', openModal));
  modal.querySelectorAll('[data-modal-close]').forEach(el => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && modal.classList.contains('open')){ closeModal(); }
  });

  // Close the modal automatically once its form is submitted (the shared
  // form[data-contact-form] handler above shows the thank-you note and resets it).
  const modalForm = modal.querySelector('form[data-contact-form]');
  if(modalForm){
    modalForm.addEventListener('submit', () => {
      setTimeout(closeModal, 1400);
    });
  }
})();
