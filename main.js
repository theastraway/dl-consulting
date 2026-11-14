(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header = document.getElementById('header');
  var hero = document.querySelector('.hero');
  function onScroll(){ header.classList.toggle('scrolled', window.scrollY > 60); }
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

  // mobile menu
  var mt = document.getElementById('menuToggle');
  mt.addEventListener('click', function(){ var o=document.body.classList.toggle('menu-open'); mt.setAttribute('aria-expanded', o); });
  document.querySelectorAll('.nav-links a').forEach(function(a){ a.addEventListener('click', function(){ document.body.classList.remove('menu-open'); mt.setAttribute('aria-expanded', false); }); });

  // count-up
  function countUp(el){
    var to = +el.dataset.to; if(reduce){ el.textContent = to; return; }
    var start = null, dur = 1800;
    function step(t){ if(!start) start=t; var p=Math.min((t-start)/dur,1); var e=1-Math.pow(1-p,4); el.textContent=Math.round(to*e); if(p<1) requestAnimationFrame(step); }
    el.textContent = 0; requestAnimationFrame(step);
  }

  // reveal
  var targets = document.querySelectorAll('.reveal, .reveal-img, .steps');
  if(reduce || !('IntersectionObserver' in window)){
    targets.forEach(function(el){ el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){
          en.target.classList.add('in');
          en.target.querySelectorAll && en.target.querySelectorAll('.count').forEach(function(c){ if(!c.dataset.done){ c.dataset.done=1; countUp(c);} });
          io.unobserve(en.target);
        }
      });
    }, {threshold:0.15, rootMargin:'0px 0px -6% 0px'});
    targets.forEach(function(el){ io.observe(el); });
    document.querySelectorAll('.count').forEach(function(c){ c.textContent = 0; });
  }

  // parallax
  var px = [].slice.call(document.querySelectorAll('[data-parallax]'));
  if(!reduce && px.length){
    var ticking=false;
    function update(){
      var vh = window.innerHeight;
      px.forEach(function(el){
        var r = el.parentElement.getBoundingClientRect();
        if(r.bottom < -200 || r.top > vh+200) return;
        var c = (r.top + r.height/2) - vh/2;
        el.style.transform = 'translate3d(0,' + (-c * parseFloat(el.dataset.parallax)).toFixed(1) + 'px,0)';
      });
      // hero subtle drift
      if(hero){ var y=window.scrollY; if(y < window.innerHeight){ hero.querySelector('.hero-inner').style.transform='translate3d(0,'+(y*0.25)+'px,0)'; hero.querySelector('.hero-inner').style.opacity = 1 - y/(window.innerHeight*0.9); } }
      ticking=false;
    }
    window.addEventListener('scroll', function(){ if(!ticking){ requestAnimationFrame(update); ticking=true; } }, {passive:true});
    window.addEventListener('resize', update); update();
  }

  // smooth FAQ
  document.querySelectorAll('details').forEach(function(d){
    var s=d.querySelector('summary'), a=d.querySelector('.ans');
    s.addEventListener('click', function(e){
      if(reduce) return; e.preventDefault();
      if(d.open){ a.animate([{height:a.offsetHeight+'px',opacity:1},{height:'0px',opacity:0}],{duration:450,easing:'cubic-bezier(.22,.61,.36,1)'}).onfinish=function(){ d.open=false; }; }
      else { d.open=true; var h=a.offsetHeight; a.animate([{height:'0px',opacity:0},{height:h+'px',opacity:1}],{duration:550,easing:'cubic-bezier(.22,.61,.36,1)'}); }
    });
  });

  // background videos: play only in view, never with reduced motion (poster stays)
  var vids = [].slice.call(document.querySelectorAll('video.bg-video'));
  if(!reduce && 'IntersectionObserver' in window){
    var vio = new IntersectionObserver(function(es){ es.forEach(function(e){
      var v = e.target;
      if(e.isIntersecting){ if(v.preload==='none'){ v.preload='auto'; v.load(); } var pr=v.play(); if(pr&&pr.catch) pr.catch(function(){}); }
      else v.pause();
    }); },{rootMargin:'200px 0px'});
    vids.forEach(function(v){ vio.observe(v); });
  }

  // inquiries: forms post straight to Danielle's inbox through FormSubmit (no email app opens)
  // FORM ALIAS: after Danielle clicks FormSubmit's one-time activation email, FormSubmit gives a
  // random alias (e.g. https://formsubmit.co/ajax/a1b2c3d4e5...). Paste it below in place of the
  // address so her email no longer appears anywhere in the site's code.
  var FORM_ENDPOINT = 'https://formsubmit.co/ajax/daniellelamb20202@gmail.com';
  function sendForm(form, subject, fields, onDone){
    var btn = form.querySelector('button[type="submit"]');
    var hp = form.querySelector('[name="_honey"]');
    if(hp && hp.value){ onDone(true); return; } // bot: pretend success, send nothing
    var payload = { _subject: subject, _template: 'table', _captcha: 'false', _honey: '' };
    Object.keys(fields).forEach(function(k){ payload[k] = fields[k]; });
    if(btn){ btn.setAttribute('aria-busy','true'); btn.dataset.label = btn.textContent; btn.textContent = 'Sending\u2026'; }
    fetch(FORM_ENDPOINT, { method:'POST', headers:{ 'Content-Type':'application/json', 'Accept':'application/json' }, body: JSON.stringify(payload) })
      .then(function(r){ return r.json().catch(function(){ return {}; }).then(function(j){ return r.ok && String(j.success) !== 'false'; }); })
      .catch(function(){ return false; })
      .then(function(ok){ if(btn){ btn.removeAttribute('aria-busy'); btn.textContent = btn.dataset.label; } onDone(ok); });
  }
  function showThanks(form, thanksId, errorId){
    return function(ok){
      var t = document.getElementById(thanksId), er = document.getElementById(errorId);
      if(ok){
        if(er) er.hidden = true;
        form.hidden = true;
        if(t){
          t.hidden = false;
          t.focus({preventScroll:true});
          var y = Math.max(0, t.getBoundingClientRect().top + window.scrollY - 140);
          if(window.__lenis && window.__lenis.scrollTo) window.__lenis.scrollTo(y, { duration: 0.9 });
          else window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }
      else if(er){ er.hidden = false; }
    };
  }
  // Contact form: AJAX to FormSubmit so the visitor stays on the page (no reCAPTCHA, no redirect).
  // Welcome email is sent from Danielle's Gmail by the bot, not by FormSubmit _autoresponse.
  var cf = document.getElementById('contact-form');
  if(cf){
    cf.addEventListener('submit', function(e){
      e.preventDefault();
      if(!cf.reportValidity()) return;
      var interest = cf.interest.value || 'Discovery Call';
      var subject = (interest === 'Discovery Call' ? 'New Discovery Call Request' : 'New ' + interest + ' Inquiry') + (cf.practice.value ? ' | ' + cf.practice.value : '') + ' | Danielle & Co. website';
      sendForm(cf, subject, {
        name: cf.name.value,
        Name: cf.name.value,
        email: cf.email.value,
        Practice: cf.practice.value || '-',
        'Interested in': interest,
        Message: cf.message.value || '-'
      }, showThanks(cf, 'contactThanks', 'contactError'));
    });
  }
  window.__dlcoSend = sendForm; // used by assessment.js (interactive 1-minute assessment)

  // Availability page: AJAX (Danielle receives the slots and chooses a time)
  function formatSlotDate(iso){
    if(!iso) return '';
    var p = iso.split('-');
    var d = new Date(+p[0], +p[1]-1, +p[2]);
    return d.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });
  }
  function formatTime(t){
    if(!t) return '';
    var hm = t.split(':'), h = +hm[0], m = hm[1] || '00', ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + m + ' ' + ap;
  }
  function todayISO(){
    var n = new Date();
    return n.getFullYear() + '-' + String(n.getMonth()+1).padStart(2,'0') + '-' + String(n.getDate()).padStart(2,'0');
  }
  var SLOT_WINDOWS = '<option value="">Select a window</option>'
    + '<option value="Morning (8–11 am)">Morning (8–11 am)</option>'
    + '<option value="Midday (11 am–2 pm)">Midday (11 am–2 pm)</option>'
    + '<option value="Afternoon (2–5 pm)">Afternoon (2–5 pm)</option>'
    + '<option value="Evening (5–8 pm)">Evening (5–8 pm)</option>';
  var af = document.getElementById('availability-form');
  if(af){
    var slotsWrap = document.getElementById('availSlots');
    var addBtn = document.getElementById('addSlot');
    function setDateMins(root){
      var min = todayISO();
      (root || af).querySelectorAll('input[type="date"]').forEach(function(inp){ inp.min = min; });
    }
    setDateMins();
    function slotCount(){ return slotsWrap.querySelectorAll('.avail-slot').length; }
    function relabel(){
      [].forEach.call(slotsWrap.querySelectorAll('.avail-slot'), function(slot, i){
        var n = i + 1;
        slot.setAttribute('data-slot', String(n));
        var lab = slot.querySelector('.avail-slot-label');
        if(lab) lab.textContent = 'Option ' + n;
        slot.querySelectorAll('[name]').forEach(function(el){
          el.name = el.name.replace(/slot_\d+_/, 'slot_' + n + '_');

        });
        var rm = slot.querySelector('.avail-remove');
        if(rm) rm.hidden = n <= 3;
      });
      if(addBtn) addBtn.hidden = slotCount() >= 8;
    }
    function makeSlot(n){
      var slot = document.createElement('div');
      slot.className = 'avail-slot';
      slot.setAttribute('data-slot', String(n));
      slot.innerHTML = '<div class="avail-slot-head"><span class="avail-slot-label">Option ' + n + '</span>'
        + (n > 3 ? '<button type="button" class="avail-remove">Remove</button>' : '')
        + '</div><div class="cf-row avail-row-3">'
        + '<label><span>Date</span><input type="date" name="slot_' + n + '_date" data-part="date" required></label>'
        + '<label><span>Time window</span><select name="slot_' + n + '_window" data-part="window" required>' + SLOT_WINDOWS + '</select></label>'
        + '<label class="opt-label"><span>Preferred start <em>optional</em></span><input type="time" name="slot_' + n + '_time" data-part="time"></label>'
        + '</div>';
      return slot;
    }
    if(addBtn){
      addBtn.addEventListener('click', function(){
        var n = slotCount() + 1;
        if(n > 8) return;
        var slot = makeSlot(n);
        slotsWrap.appendChild(slot);
        setDateMins(slot);
        relabel();
        var first = slot.querySelector('input[type="date"]');
        if(first) first.focus();
      });
    }
    slotsWrap.addEventListener('click', function(e){
      var btn = e.target.closest('.avail-remove');
      if(!btn) return;
      var slot = btn.closest('.avail-slot');
      if(slot && slotCount() > 3){ slot.remove(); relabel(); }
    });
    af.addEventListener('submit', function(e){
      e.preventDefault();
      var er = document.getElementById('availError');
      if(er) er.hidden = true;
      if(!af.reportValidity()) return;
      var options = [];
      [].forEach.call(slotsWrap.querySelectorAll('.avail-slot'), function(slot){
        var date = slot.querySelector('[data-part="date"]').value;
        var win = slot.querySelector('[data-part="window"]').value;
        var time = slot.querySelector('[data-part="time"]').value;
        if(!date || !win) return;
        var line = formatSlotDate(date) + ' · ' + win;
        if(time) line += ' · prefers ' + formatTime(time);
        options.push(line);
      });
      if(options.length < 3){
        if(er){ er.hidden = false; er.textContent = 'Please share at least three days and times that work for you.'; }
        return;
      }
      var fields = {
        Name: af.name.value,
        email: af.email.value,
        Practice: af.practice.value || '-',
        'Time zone': af.timezone.value,
        Note: af.note.value || '-'
      };
      options.forEach(function(line, i){ fields['Option ' + (i + 1)] = line; });
      sendForm(af, 'Availability for discovery call: ' + af.name.value, fields, showThanks(af, 'availThanks', 'availError'));
    });
  }
  // "Learn more" on a service card preselects that service in the form
  [].forEach.call(document.querySelectorAll('[data-interest]'), function(a){
    a.addEventListener('click', function(){ if(cf && cf.interest) cf.interest.value = a.dataset.interest; });
  });
})();
