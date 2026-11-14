/* Danielle & Co. v4 motion layer: smooth scroll, scroll transitions, custom cursor, ambient sound.
   Everything here is progressive: the site works fully if this file or Lenis fails to load. */
(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var root = document.documentElement;

  /* ---------- 1. Smooth scroll (Lenis, self-hosted) ---------- */
  var lenis = null;
  if(!reduce && window.Lenis){
    lenis = new window.Lenis({ duration: 1.25, easing: function(t){ return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
    window.__lenis = lenis;
    (function raf(time){ lenis.raf(time); requestAnimationFrame(raf); })(performance.now());
    document.querySelectorAll('a[href^="#"]').forEach(function(a){
      a.addEventListener('click', function(e){
        var id = a.getAttribute('href'); if(id.length < 2) return;
        var el = document.querySelector(id); if(!el) return;
        e.preventDefault();
        lenis.scrollTo(el, { offset: id === '#top' ? 0 : -86, duration: 1.6 });
        history.replaceState(null, '', id);
      });
    });
  }

  /* ---------- 2. Split-word heading reveals ---------- */
  if(!reduce){
    document.querySelectorAll('main h2.reveal, .statement-text.reveal').forEach(function(h){
      var i = 0;
      (function walk(node){
        [].slice.call(node.childNodes).forEach(function(n){
          if(n.nodeType === 3){
            var frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach(function(part){
              if(!part) return;
              if(/^\s+$/.test(part)){ frag.appendChild(document.createTextNode(' ')); return; }
              var w = document.createElement('span'); w.className = 'sw';
              var inner = document.createElement('span'); inner.textContent = part; inner.style.setProperty('--wi', i++);
              w.appendChild(inner); frag.appendChild(w);
            });
            n.parentNode.replaceChild(frag, n);
          } else if(n.nodeType === 1){ walk(n); }
        });
      })(h);
      h.classList.add('split');
    });
  }

  /* ---------- 3. Scroll-driven transitions ---------- */
  var curtains = [].slice.call(document.querySelectorAll('.difference, .statement, .assess, .final, .wellbeing'));
  curtains.forEach(function(s){ s.classList.add('curtain'); });
  var zooms = [].slice.call(document.querySelectorAll('.card-img img, .tri-img img, .wellmask img, .wmask img, .pmask img, .final-bg img, .portrait img'));
  var heroMedia = document.querySelector('.hero-media');
  var bar = document.createElement('div'); bar.className = 'scroll-progress'; bar.setAttribute('aria-hidden','true'); document.body.appendChild(bar);
  function clamp(v){ return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(p){ return 1 - Math.pow(1 - p, 3); }
  var ticking = false;
  function frame(){
    ticking = false;
    var vh = window.innerHeight, y = window.scrollY, max = document.documentElement.scrollHeight - vh;
    bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0).toFixed(4) + ')';
    if(reduce) return;
    curtains.forEach(function(s){
      var r = s.getBoundingClientRect();
      if(r.top > vh || r.bottom < 0){ return; }
      var p = ease(clamp((vh - r.top) / (vh * 0.75)));
      var k = 1 - p;
      if(k < 0.002){ s.style.clipPath = 'none'; return; }
      s.style.clipPath = 'inset(0 ' + (k * 4.5).toFixed(2) + '% 0 ' + (k * 4.5).toFixed(2) + '% round ' + (k * 40).toFixed(1) + 'px ' + (k * 40).toFixed(1) + 'px 0 0)';
    });
    zooms.forEach(function(img){
      var r = img.parentElement.getBoundingClientRect();
      if(r.top > vh || r.bottom < 0) return;
      var p = ease(clamp((vh - r.top) / (vh * 0.9)));
      img.style.scale = (1.14 - 0.14 * p).toFixed(4);
    });
    if(heroMedia && y < vh * 1.2){
      heroMedia.style.scale = (1 + y / vh * 0.08).toFixed(4);
      heroMedia.style.opacity = (1 - y / vh * 0.35).toFixed(3);
    }
  }
  function req(){ if(!ticking){ ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', req);
  frame();

  /* ---------- 4. Custom cursor (desktop with a mouse only) ---------- */
  if(finePointer && !reduce){
    var dot = document.createElement('div'); dot.className = 'cursor-dot';
    var ring = document.createElement('div'); ring.className = 'cursor-ring'; ring.innerHTML = '<span class="cursor-label"></span>';
    [dot, ring].forEach(function(el){ el.setAttribute('aria-hidden','true'); document.body.appendChild(el); });
    var label = ring.firstChild;
    root.classList.add('has-cursor');
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, shown = false;
    window.addEventListener('mousemove', function(e){
      mx = e.clientX; my = e.clientY;
      if(!shown){ shown = true; rx = mx; ry = my; root.classList.add('cursor-on'); }
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
    }, { passive: true });
    document.addEventListener('mouseleave', function(){ root.classList.remove('cursor-on'); shown = false; });
    (function loop(){
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      ring.style.transform = 'translate3d(' + rx.toFixed(2) + 'px,' + ry.toFixed(2) + 'px,0)';
      requestAnimationFrame(loop);
    })();
    var INTERACTIVE = 'a, button, summary, select, label, [role="tab"]';
    var TEXT = 'input, textarea';
    document.addEventListener('mouseover', function(e){
      var t = e.target;
      var lab = t.closest('[data-cursor]');
      root.classList.toggle('cursor-text', !!t.closest(TEXT));
      root.classList.toggle('cursor-link', !lab && !!t.closest(INTERACTIVE));
      root.classList.toggle('cursor-label-on', !!lab);
      label.textContent = lab ? lab.getAttribute('data-cursor') : '';
      var dark = t.closest('.hero, .difference, .statement, .assess, .final, .marquee, .card.featured, footer');
      root.classList.toggle('cursor-dark', !!dark);
    });
    document.addEventListener('mousedown', function(){ root.classList.add('cursor-down'); });
    document.addEventListener('mouseup', function(){ root.classList.remove('cursor-down'); });
  }

  /* ---------- 5. Ambient sound: plays softly by default, remembers a mute ----------
     Behavior: on load we try to start at very low volume with a slow fade-in. Browsers block audible
     autoplay until the visitor interacts, so if blocked it starts (same gentle fade) on their first
     click, tap, or key press. Scroll/wheel alone does not count as interaction in most browsers.
     As the visitor scrolls, volume eases to silence by the third section and returns if they scroll back up.
     Muting with the toggle is saved in localStorage ('dlco-sound' = 'off') and auto-start is skipped. */
  var SRC = 'audio/clean-soul-loop.mp3', KEY = 'dlco-sound', VOL = 0.4, FADE_IN = 6, FADE_OUT = 1.2;
  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'sound-toggle';
  btn.setAttribute('aria-pressed','false'); btn.setAttribute('aria-label','Play ambient sound');
  btn.innerHTML = '<span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="st-label">Sound</span><span class="st-state">Off</span>';
  document.body.appendChild(btn);
  var AC = window.AudioContext || window.webkitAudioContext;
  var ctx = null, gain = null, scrollGain = null, source = null, bufferP = null, audioEl = null, playing = false, wanted = false;
  function setUI(on){
    playing = on;
    btn.classList.toggle('is-on', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on ? 'Mute ambient sound' : 'Play ambient sound');
    btn.querySelector('.st-state').textContent = on ? 'On' : 'Off';
  }
  function store(v){ try{ localStorage.setItem(KEY, v); }catch(e){} }
  function ensureCtx(){
    if(ctx || !AC) return;
    ctx = new AC(); gain = ctx.createGain(); gain.gain.value = 0; scrollGain = ctx.createGain(); scrollGain.gain.value = scrollFactor(); gain.connect(scrollGain); scrollGain.connect(ctx.destination);
  }
  function loadBuffer(){
    ensureCtx(); if(!ctx) return Promise.reject();
    if(!bufferP){ bufferP = fetch(SRC).then(function(r){ if(!r.ok) throw 0; return r.arrayBuffer(); }).then(function(ab){ return new Promise(function(res, rej){ ctx.decodeAudioData(ab, res, rej); }); }); }
    return bufferP;
  }
  function ramp(v, secs){
    if(gain){ var now = ctx.currentTime; gain.gain.cancelScheduledValues(now); gain.gain.setValueAtTime(gain.gain.value, now); gain.gain.linearRampToValueAtTime(v, now + secs); }
    else if(audioEl){ var a = audioEl.volume, t0 = performance.now(); (function step(){ var p = Math.min(1, (performance.now() - t0) / (secs * 1000)); audioEl.volume = a + (v - a) * p; if(p < 1) requestAnimationFrame(step); else if(v === 0) audioEl.pause(); })(); }
  }
  // Try to make sound now. Resolves true if audio is actually running.
  function tryStart(){
    if(!AC){ // very old browsers: plain <audio>
      if(!audioEl){ audioEl = new Audio(SRC); audioEl.loop = true; audioEl.volume = 0; }
      return audioEl.play().then(function(){ ramp(VOL, FADE_IN); setUI(true); return true; }).catch(function(){ return false; });
    }
    return loadBuffer().then(function(buf){
      if(ctx.state !== 'running'){ ctx.resume(); } // only succeeds inside a user gesture (or if autoplay is allowed)
      return new Promise(function(res){ setTimeout(res, 60); }).then(function(){
        if(ctx.state !== 'running') return false;
        if(!source){ source = ctx.createBufferSource(); source.buffer = buf; source.loop = true; source.connect(gain); source.start(); }
        ramp(VOL, FADE_IN); setUI(true); return true;
      });
    }).catch(function(){ return false; });
  }
  var GESTURES = ['pointerdown','keydown','touchend','touchstart','wheel','scroll'];
  function onGesture(e){
    if(e && btn.contains(e.target)) return; // the toggle handles itself
    if(!wanted || playing) return disarm();
    if(ctx && ctx.state !== 'running') ctx.resume(); // must be called synchronously inside the gesture
    tryStart().then(function(ok){ if(ok) disarm(); });
  }
  function arm(){ btn.querySelector('.st-state').textContent = 'On'; btn.setAttribute('aria-pressed','true'); btn.setAttribute('aria-label','Mute ambient sound'); GESTURES.forEach(function(ev){ window.addEventListener(ev, onGesture, { capture: true, passive: true }); }); btn.classList.add('is-armed'); }
  function disarm(){ GESTURES.forEach(function(ev){ window.removeEventListener(ev, onGesture, { capture: true, passive: true }); }); btn.classList.remove('is-armed'); }
  function mute(){
    wanted = false; disarm(); ramp(0, FADE_OUT); setUI(false); store('off');
    if(ctx){ setTimeout(function(){ if(!playing && ctx.state === 'running') ctx.suspend(); }, FADE_OUT * 1000 + 100); }
  }
  function unmute(){
    wanted = true; store('on'); btn.classList.add('is-loading');
    if(ctx && ctx.state !== 'running') ctx.resume();
    tryStart().then(function(ok){ btn.classList.remove('is-loading'); if(!ok) arm(); });
  }
  btn.addEventListener('click', function(){ (playing || wanted) ? mute() : unmute(); });
  // Scroll fade: full (soft) volume in the hero, easing to silence by the third section
  // (hero -> outcome tiles -> Technology & Data). Scrolling back up brings it back, unless muted.
  var third = document.querySelector('.tri');
  function scrollFactor(){
    if(!third) return 1;
    var end = third.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.35;
    if(end <= 0) return 0;
    var p = Math.min(1, Math.max(0, window.scrollY / end));
    return 0.5 + 0.5 * Math.cos(Math.PI * p); // smooth 1 -> 0
  }
  window.__soundScrollFactor = scrollFactor; // read-only debug hook
  var sfTick = false;
  function applyScrollFade(){
    sfTick = false;
    var f = scrollFactor();
    if(scrollGain){ scrollGain.gain.setTargetAtTime(f, ctx.currentTime, 0.12); }
    else if(audioEl && playing){ audioEl.volume = VOL * f; }
    btn.classList.toggle('is-faded', playing && f < 0.02);
  }
  window.addEventListener('scroll', function(){ if(!sfTick){ sfTick = true; requestAnimationFrame(applyScrollFade); } }, { passive: true });
  window.addEventListener('resize', applyScrollFade);
  var pref = null; try{ pref = localStorage.getItem(KEY); }catch(e){}
  if(pref !== 'off'){
    wanted = true;
    arm(); // in case autoplay is blocked, the first interaction starts it
    var auto = function(){ tryStart().then(function(ok){ if(ok) disarm(); }); };
    if(document.readyState === 'complete') setTimeout(auto, 600); else window.addEventListener('load', function(){ setTimeout(auto, 600); });
  }
  document.addEventListener('visibilitychange', function(){ if(!ctx || !playing) return; document.hidden ? ctx.suspend() : ctx.resume(); });
})();
