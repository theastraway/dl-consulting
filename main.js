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
      if(ok){ if(er) er.hidden = true; form.hidden = true; if(t){ t.hidden = false; t.focus({preventScroll:true}); } }
      else if(er){ er.hidden = false; }
    };
  }
  var cf = document.getElementById('contact-form');
  if(cf){
    cf.addEventListener('submit', function(e){
      e.preventDefault();
      if(!cf.reportValidity()) return;
      var interest = cf.interest.value || 'Discovery Call';
      var subject = (interest === 'Discovery Call' ? 'New Discovery Call Request' : 'New ' + interest + ' Inquiry') + (cf.practice.value ? ' | ' + cf.practice.value : '') + ' | Danielle & Co. website';
      sendForm(cf, subject, { Name: cf.name.value, email: cf.email.value, Practice: cf.practice.value || '-', 'Interested in': interest, Message: cf.message.value || '-' }, showThanks(cf, 'contactThanks', 'contactError'));
    });
  }
  window.__dlcoSend = sendForm; // used by assessment.js (interactive 1-minute assessment)
  // "Learn more" on a service card preselects that service in the form
  [].forEach.call(document.querySelectorAll('[data-interest]'), function(a){
    a.addEventListener('click', function(){ if(cf && cf.interest) cf.interest.value = a.dataset.interest; });
  });
})();
