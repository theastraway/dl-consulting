/* Danielle & Co. interactive 1-Minute Operations Assessment (5 questions, scored /25).
   Visitors tap 1-5 on each point, see a live total, then results. On "See my results" the answers are
   sent automatically to Danielle through the site's FormSubmit endpoint (main.js -> window.__dlcoSend). */
(function(){
  var DATA = {"points": [{"title": "The Numbers", "pillar": "numbers", "start": "Start a simple monthly budget review with each leader, and look at next week\u2019s open capacity every Friday."}, {"title": "The Systems", "pillar": "systems", "start": "Write down the five tasks that matter most, done the same way everywhere, and turn on confirmations and a waitlist."}, {"title": "The People", "pillar": "people", "start": "Match staffing to your busiest hours, and build a simple first-ninety-days plan for every new hire."}, {"title": "Wellbeing & Engagement", "pillar": "wellbeing", "start": "Start a short monthly team check-in, close the loop on what you hear, and make recognition specific and regular."}, {"title": "Technology & KPIs", "pillar": "tech", "start": "Choose five KPIs, give each an owner, review them on the same day every week, and fix the biggest double-entry first."}], "pillars": [{"key": "numbers", "roman": "I", "name": "The Numbers"}, {"key": "systems", "roman": "II", "name": "The Systems"}, {"key": "people", "roman": "III", "name": "The People"}, {"key": "wellbeing", "roman": "IV", "name": "Wellbeing & Engagement"}, {"key": "tech", "roman": "V", "name": "Technology & KPIs"}]};
  var BANDS = [
    { min: 21, title: 'Well run and ready to grow', text: 'Your foundations are strong. The opportunity is to protect what works as you scale, and to keep your team\u2019s energy as high as your numbers.' },
    { min: 16, title: 'Strong foundations, clear opportunities', text: 'Much is working. One or two areas are quietly costing you time, revenue, or energy. Your lowest scores show where.' },
    { min: 11, title: 'Stretched', text: 'Good people are holding things together, and the system is carrying strain. Small, well-chosen changes here tend to make the biggest difference.' },
    { min: 0,  title: 'Running on goodwill', text: 'The day depends on effort more than structure. It is very fixable, and it starts with a clear plan and a few steady rhythms.' }
  ];
  var form = document.getElementById('assessQuiz'); if(!form) return;
  var results = document.getElementById('qzResults');
  var totalEl = document.getElementById('qzTotal'), bar = document.getElementById('qzBar'), count = document.getElementById('qzCount');
  var msg = document.getElementById('qzMsg');
  var N = DATA.points.length;
  function scores(){ var s = []; for(var i = 0; i < N; i++){ var c = form.querySelector('input[name="q' + (i + 1) + '"]:checked'); s.push(c ? +c.value : 0); } return s; }
  function pillarTotals(s){
    return DATA.pillars.map(function(p){
      var got = 0, max = 0;
      DATA.points.forEach(function(pt, i){ if(pt.pillar === p.key){ got += s[i]; max += 5; } });
      return { key: p.key, label: p.roman + '. ' + p.name, got: got, max: max };
    });
  }
  function update(){
    var s = scores(), answered = s.filter(Boolean).length, total = s.reduce(function(a, b){ return a + b; }, 0);
    totalEl.textContent = total;
    bar.style.width = (answered / N * 100) + '%';
    count.textContent = answered + ' of ' + N + ' answered';
    pillarTotals(s).forEach(function(p){
      var li = document.querySelector('.qz-pillars li[data-pillar="' + p.key + '"]'); if(!li) return;
      li.querySelector('i').style.width = (p.got / p.max * 100) + '%';
      li.querySelector('.pl-val').textContent = p.got + '/' + p.max;
    });
    form.classList.toggle('qz-complete', answered === N); var eb = document.querySelector('.qz-card .qz-eb'); if(eb) eb.textContent = answered === N ? 'Your score' : 'Your score so far';
    if(answered === N && msg && !msg.hidden && msg.dataset.kind === 'answers'){ msg.hidden = true; }
  }
  form.addEventListener('change', function(e){
    if(e.target.type !== 'radio') return;
    var item = e.target.closest('.qz-item'); if(item){ item.classList.add('is-answered'); item.classList.remove('is-missing'); }
    update();
  });
  function band(total){ for(var i = 0; i < BANDS.length; i++){ if(total >= BANDS[i].min) return BANDS[i]; } return BANDS[BANDS.length - 1]; }
  function lowest(s){
    return s.map(function(v, i){ return { i: i, v: v }; }).sort(function(a, b){ return a.v - b.v || a.i - b.i; }).slice(0, 2);
  }
  function scrollToEl(el, offset){
    if(window.__lenis){ if(window.__lenis.resize) window.__lenis.resize(); window.__lenis.scrollTo(el, { offset: offset || -100, duration: 1.2 }); }
    else { var y = el.getBoundingClientRect().top + window.scrollY + (offset || -100); window.scrollTo({ top: y, behavior: 'smooth' }); }
  }
  function showMsg(text, kind){ msg.textContent = text; msg.dataset.kind = kind; msg.hidden = false; }
  var last = null;
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var s = scores(), missing = [];
    s.forEach(function(v, i){ if(!v) missing.push(i); });
    form.querySelectorAll('.qz-item').forEach(function(it){ it.classList.toggle('is-missing', missing.indexOf(+it.dataset.i) > -1); });
    if(missing.length){
      showMsg('Please score ' + (missing.length === 1 ? 'point ' : 'points ') + missing.map(function(i){ return String(i + 1).padStart(2, '0'); }).join(', ') + ' first.', 'answers');
      var first = form.querySelector('.qz-item[data-i="' + missing[0] + '"]');
      scrollToEl(first, -120); var r = first.querySelector('input'); if(r) setTimeout(function(){ r.focus({ preventScroll: true }); }, 700);
      return;
    }
    if(!form.name.value.trim() || !form.email.checkValidity() || !form.email.value.trim()){
      showMsg('Please add your name and a valid email so we can send your results.', 'details');
      (form.name.value.trim() ? form.email : form.name).focus();
      return;
    }
    msg.hidden = true;
    var total = s.reduce(function(a, b){ return a + b; }, 0), b = band(total), pt = pillarTotals(s), low = lowest(s);
    last = { name: form.name.value.trim(), email: form.email.value.trim(), practice: form.practice.value.trim(), total: total, band: b, low: low };
    // render results
    document.getElementById('qrTotal').textContent = total;
    document.getElementById('qrBand').textContent = b.title;
    document.getElementById('qrBandText').textContent = b.text;
    document.getElementById('qrPillars').innerHTML = pt.map(function(p){
      return '<li><span class="pl-name">' + p.label.replace(/&/g, '&amp;') + '</span><span class="pl-bar"><i style="width:' + (p.got / p.max * 100) + '%"></i></span><span class="pl-val">' + p.got + '/' + p.max + '</span></li>';
    }).join('');
    document.getElementById('qrLow').innerHTML = low.map(function(l){
      var p = DATA.points[l.i];
      return '<li><span class="ql-n">' + String(l.i + 1).padStart(2, '0') + '</span><div><h5>' + p.title.replace(/&/g, '&amp;') + ' <em>' + l.v + '/5</em></h5><p>' + p.start + '</p></div></li>';
    }).join('');
    var status = document.getElementById('qrStatus');
    status.textContent = 'Sending your results to Danielle\u2026'; status.className = 'qr-status';
    form.hidden = true; results.hidden = false;
    scrollToEl(results, -110);
    setTimeout(function(){ results.focus({ preventScroll: true }); }, 400);
    // auto-send to Danielle, no extra step
    var fields = { Name: last.name, email: last.email, 'Practice / business': last.practice || '-', 'Total score': total + '/25', Result: b.title };
    pt.forEach(function(p){ fields[p.label] = p.got + '/' + p.max; });
    fields['Two lowest areas'] = low.map(function(l){ return DATA.points[l.i].title + ' (' + l.v + '/5)'; }).join('; ');
    var send = window.__dlcoSend;
    var done = function(ok){
      status.textContent = ok ? 'Your results have been sent to Danielle.' : 'We couldn\u2019t send your results automatically. Booking a call below will still reach Danielle.';
      status.className = 'qr-status ' + (ok ? 'ok' : 'err');
    };
    if(send){ send(form, 'New 1-Minute Assessment: ' + last.name + ', ' + total + '/25', fields, done); } else { done(false); }
  });
  // Book your discovery call: prefill the contact form and take them there
  document.getElementById('qrBook').addEventListener('click', function(e){
    var cf = document.getElementById('contact-form'); if(!cf || !last) return;
    e.preventDefault(); e.stopImmediatePropagation();
    cf.name.value = last.name; cf.email.value = last.email; if(last.practice) cf.practice.value = last.practice;
    if(cf.interest) cf.interest.value = '1-Minute Assessment';
    var lows = last.low.map(function(l){ return DATA.points[l.i].title; });
    cf.message.value = 'I just completed the 1-Minute Assessment and scored ' + last.total + '/25 (' + last.band.title + '). My lowest areas were ' + lows[0] + ' and ' + lows[1] + '. I\u2019d love to talk through where to start.';
    cf.classList.add('is-prefilled');
    scrollToEl(cf, -120);
    setTimeout(function(){ var b = cf.querySelector('button[type="submit"]'); if(b) b.focus({ preventScroll: true }); }, 1300);
  }, true);
  document.getElementById('qrRetake').addEventListener('click', function(){
    form.reset(); form.querySelectorAll('.qz-item').forEach(function(it){ it.classList.remove('is-answered', 'is-missing'); });
    results.hidden = true; form.hidden = false; update(); scrollToEl(document.getElementById('assessment'), -60);
  });
  update();
})();
