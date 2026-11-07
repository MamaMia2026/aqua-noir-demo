const WHATSAPP_NUMBER = '40700000000'; /* numărul de WhatsApp al studioului, fără + (ex: 40700000000) */

/* Aqua Noir – machetă demo: meniu, prețuri pe mărime, abonament, card cadou și programare
   (sloturi pe durata totală, trimitere prin Netlify Forms sau WhatsApp). Datele vin din data.js. */
(() => {
  'use strict';

  /* ---------- utilitare ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const pad = n => String(n).padStart(2, '0');
  const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const hhmm = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
  const nr = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const lei = n => `${nr(n)} lei`;
  const durTxt = m => {
    const h = Math.floor(m / 60), r = m % 60;
    return [h ? (h === 1 ? '1 oră' : `${h} ore`) : '', r ? `${r} min` : ''].filter(Boolean).join(' ');
  };
  const ZI = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'];
  const ZIUA = ['duminică', 'luni', 'marți', 'miercuri', 'joi', 'vineri', 'sâmbătă'];
  const ZIUA_MARE = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
  const LUNA = ['ian.', 'feb.', 'mar.', 'apr.', 'mai', 'iun.', 'iul.', 'aug.', 'sept.', 'oct.', 'nov.', 'dec.'];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollTo = id => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); };

  /* ---------- WhatsApp ---------- */
  const waUrl = text => `https://wa.me/${WHATSAPP_NUMBER}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
  $$('[data-wa]').forEach(a => { a.href = waUrl('Bună ziua! Aș dori o programare la Aqua Noir.'); });

  /* ---------- meniu ---------- */
  const menuBtn = $('[data-menu]');
  const nav = $('#meniu');
  const hdr = $('#hdr');
  if (menuBtn && nav) {
    const setOpen = open => {
      if (open) nav.style.setProperty('--menu-top', `${Math.max(0, hdr.getBoundingClientRect().bottom)}px`);
      nav.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Închide meniul' : 'Deschide meniul');
    };
    menuBtn.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
    nav.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
    if ('IntersectionObserver' in window) {
      const links = $$('a', nav);
      const io = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          links.forEach(a => a.setAttribute('aria-current', String(a.getAttribute('href') === `#${en.target.id}`)));
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      links.forEach(a => { const t = document.getElementById(a.getAttribute('href').slice(1)); if (t) io.observe(t); });
    }
  }

  /* ---------- video erou (după încărcarea paginii) ---------- */
  const vid = $('#heroVideo');
  const saveData = navigator.connection && navigator.connection.saveData;
  if (vid && !reduced && !saveData) {
    // pornește la prima interacțiune sau după câteva secunde, ca să nu încetinească încărcarea
    let started = false;
    const evs = ['pointerdown', 'pointermove', 'touchstart', 'scroll', 'keydown'];
    const start = () => {
      if (started) return;
      started = true;
      evs.forEach(ev => window.removeEventListener(ev, start));
      $$('source[data-src]', vid).forEach(s => { s.src = s.dataset.src; });
      vid.addEventListener('playing', () => vid.classList.add('on'), { once: true });
      vid.load();
      const p = vid.play();
      if (p && p.catch) p.catch(() => { /* redarea automată blocată: rămâne imaginea */ });
    };
    window.addEventListener('load', () => {
      evs.forEach(ev => window.addEventListener(ev, start, { passive: true, once: true }));
      setTimeout(start, 6000);
    });
  }

  /* ---------- program (o singură sursă: PROGRAM din data.js) ---------- */
  const hoursOf = d => { const p = PROGRAM[d.getDay()]; return p ? [toMin(p[0]), toMin(p[1])] : null; };
  (() => {
    const dl = $('#program');
    if (!dl) return;
    const order = [1, 2, 3, 4, 5, 6, 0];
    const val = w => (PROGRAM[w] ? `${PROGRAM[w][0]}–${PROGRAM[w][1]}` : 'închis');
    const groups = [];
    order.forEach(w => {
      const last = groups[groups.length - 1];
      if (last && last.v === val(w)) last.to = w; else groups.push({ from: w, to: w, v: val(w) });
    });
    groups.forEach(g => {
      const dt = document.createElement('dt');
      dt.textContent = g.from === g.to ? ZIUA_MARE[g.from] : `${ZIUA_MARE[g.from]}–${ZIUA_MARE[g.to]}`;
      const dd = document.createElement('dd');
      dd.textContent = g.v;
      dl.append(dt, dd);
    });
    const dt = document.createElement('dt'); dt.textContent = 'Parcare';
    const dd = document.createElement('dd'); dd.textContent = '3 locuri pentru clienți';
    dl.append(dt, dd);
  })();

  /* ---------- stare ---------- */
  const state = { mode: 'prog', pack: 'ext', size: 'compact', extras: [], ab: 'ab4', card: 'v500', day: null, start: null };
  const form = $('#rezervare');
  const daysBox = $('#f-days');
  const slotsBox = $('#f-slots');
  const hint = $('#slot-hint');
  const msg = $('#s-msg');

  const abCalc = (id, size) => {
    const a = ABONAMENTE[id];
    const full = PACHETE.ext.pret[size] * a.spalari;
    const save = full - a.pret[size];
    return { full, save, pct: Math.round((save / full) * 100) };
  };
  const cardInfo = (id, size) => {
    if (id.startsWith('v')) { const v = +id.slice(1); return { label: `Card valoric ${lei(v)}`, value: v }; }
    const k = id.slice(2);
    return { label: `Card pachet ${PACHETE[k].nume} · ${MARIMI[size]}`, value: PACHETE[k].pret[size] };
  };
  const duration = () => {
    if (state.mode === 'ab') return PACHETE.ext.durata[state.size];
    return PACHETE[state.pack].durata[state.size] + state.extras.reduce((s, k) => s + EXTRA[k].durata, 0);
  };
  const total = () => {
    if (state.mode === 'ab') return ABONAMENTE[state.ab].pret[state.size];
    if (state.mode === 'card') return cardInfo(state.card, state.size).value;
    return PACHETE[state.pack].pret[state.size] + state.extras.reduce((s, k) => s + EXTRA[k].pret, 0);
  };

  /* ---------- liste generate din data.js ---------- */
  const xList = $('#extra-list');
  if (xList) xList.innerHTML = Object.values(EXTRA).map(x => `<li>${x.nume}<span>+${lei(x.pret)} · +${durTxt(x.durata)}</span></li>`).join('');
  const xBox = $('#f-extra');
  if (xBox) xBox.innerHTML = Object.entries(EXTRA).map(([k, x]) =>
    `<label class="opt"><input type="checkbox" name="ui_extra" value="${k}"><span><em>${x.nume}<small> +${lei(x.pret)} · +${durTxt(x.durata)}</small></em></span></label>`).join('');
  $$('[data-card-valid]').forEach(e => { e.textContent = CARD_CADOU.valabilitateLuni; });
  const gv = $('#gift-values');
  if (gv) gv.innerHTML = CARD_CADOU.valori.map(v => `<li>${lei(v)}</li>`).join('');

  /* ---------- prețuri pe mărime ---------- */
  function paintPrices() {
    const sz = state.size;
    Object.entries(PACHETE).forEach(([k, p]) => {
      $$(`[data-price="${k}"]`).forEach(el => { el.textContent = nr(p.pret[sz]); });
      $$(`[data-dur="${k}"]`).forEach(el => { el.textContent = durTxt(p.durata[sz]); });
      $$(`[data-pk-label="${k}"]`).forEach(el => { el.textContent = `${durTxt(p.durata[sz])} · ${lei(p.pret[sz])}`; });
    });
    Object.entries(ABONAMENTE).forEach(([k, a]) => {
      const c = abCalc(k, sz);
      $$(`[data-ab-price="${k}"]`).forEach(el => { el.textContent = nr(a.pret[sz]); });
      $$(`[data-ab-full="${k}"]`).forEach(el => { el.textContent = `${a.spalari} × ${lei(PACHETE.ext.pret[sz])} = ${lei(c.full)}`; });
      $$(`[data-ab-save="${k}"]`).forEach(el => { el.textContent = `Economisești ${lei(c.save)} / lună (${c.pct}%)`; });
      $$(`[data-ab-label="${k}"]`).forEach(el => { el.textContent = `${lei(a.pret[sz])} / lună · −${lei(c.save)}`; });
    });
    const gp = $('#gift-packs');
    if (gp) gp.innerHTML = Object.values(PACHETE).map(p => `<li>${p.nume} · ${lei(p.pret[sz])}</li>`).join('');
    const co = $('#card-opts');
    if (co) {
      const opts = CARD_CADOU.valori.map(v => ({ id: `v${v}`, t: lei(v), s: 'valoare fixă' }))
        .concat(Object.entries(PACHETE).map(([k, p]) => ({ id: `p-${k}`, t: `Pachet ${p.nume}`, s: `${MARIMI[sz]} · ${lei(p.pret[sz])}` })));
      co.innerHTML = opts.map(o => `<label class="opt"><input type="radio" name="ui_card" value="${o.id}"${o.id === state.card ? ' checked' : ''}><span>${o.t}<small>${o.s}</small></span></label>`).join('');
    }
    $$('[data-size]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.size === sz)));
    const r = form && form.querySelector(`input[name="ui_marime"][value="${sz}"]`);
    if (r) r.checked = true;
  }

  /* ---------- sloturi: ore ocupate de exemplu, generate determinist din dată ---------- */
  const busyCache = {};
  const busyHours = d => {
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (busyCache[key]) return busyCache[key];
    let seed = (d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate()) >>> 0;
    const rnd = () => { seed = (Math.imul(seed ^ (seed >>> 15), 2246822507) + 0x9e3779b9) >>> 0; return (seed >>> 8) / 16777216; };
    const h = hoursOf(d), list = [];
    if (h) {
      const open = h[0] / 60, close = h[1] / 60;
      const n = 2 + Math.floor(rnd() * 2);
      for (let i = 0; i < n; i++) {
        const len = 1 + Math.floor(rnd() * 2), s = open + Math.floor(rnd() * (close - open - len + 1));
        list.push([s * 60, (s + len) * 60]);
      }
    }
    return (busyCache[key] = list);
  };
  // boxa de ceramică: o singură mașină pe zi, unele zile sunt deja ocupate
  const ceramicBoxTaken = d => (d.getDate() * 7 + d.getMonth()) % 4 === 1;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(today); d.setDate(today.getDate() + i); return d; });

  function slotsFor(d, dur) {
    const h = hoursOf(d);
    if (!h) return [];
    const now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes();
    const isToday = d.getTime() === today.getTime();
    const ceramic = state.mode === 'prog' && state.pack === 'cer';
    const out = [];
    for (let s = h[0]; s + 60 <= h[1]; s += 60) {
      let why = '';
      if (isToday && s <= nowMin) why = 'a trecut';
      else if (s + dur > h[1]) why = 'nu încape până la închidere';
      else if (ceramic ? ceramicBoxTaken(d) : busyHours(d).some(([a, b]) => s < b && s + dur > a)) why = 'ocupat';
      out.push({ s, ok: !why, why });
    }
    return out;
  }
  const hasFree = (d, dur) => slotsFor(d, dur).some(x => x.ok);

  function renderDays() {
    if (!daysBox) return;
    const dur = duration();
    if (state.day === null || !hasFree(days[state.day], dur)) {
      state.day = null;
      for (let i = 0; i < days.length; i++) if (hasFree(days[i], dur)) { state.day = i; break; }
    }
    daysBox.innerHTML = days.map((d, i) => {
      const free = slotsFor(d, dur).filter(x => x.ok).length;
      const sub = !hoursOf(d) ? 'închis' : free ? (i === 0 ? 'azi' : LUNA[d.getMonth()]) : 'plin';
      return `<label class="opt"><input type="radio" name="ui_zi" value="${i}"${free ? '' : ' disabled'}${i === state.day ? ' checked' : ''} aria-label="${ZIUA[d.getDay()]} ${d.getDate()} ${LUNA[d.getMonth()]}${free ? '' : `, ${sub === 'închis' ? 'închis' : 'indisponibil'}`}"><span><small>${ZI[d.getDay()]}</small><b>${d.getDate()}</b><small>${sub}</small></span></label>`;
    }).join('');
  }
  function renderSlots() {
    if (!slotsBox) return;
    const dur = duration();
    if (state.day === null) {
      slotsBox.innerHTML = ''; state.start = null;
      hint.textContent = `Nu mai sunt intervale libere de ${durTxt(dur)} în următoarele 7 zile. Sună-ne și găsim o soluție.`;
      return;
    }
    const d = days[state.day], h = hoursOf(d);
    const list = slotsFor(d, dur);
    if (!list.some(x => x.ok && x.s === state.start)) state.start = null;
    slotsBox.innerHTML = list.map(x => {
      const late = x.s + dur > h[1];
      const txt = late ? `${hhmm(x.s)}<small>nu încape</small>` : `${hhmm(x.s)}–${hhmm(x.s + dur)}`;
      const aria = late ? `început ${hhmm(x.s)}, ${x.why}` : `${hhmm(x.s)}–${hhmm(x.s + dur)}${x.ok ? '' : `, ${x.why}`}`;
      return `<label class="opt"><input type="radio" name="ui_ora" value="${x.s}"${x.ok ? '' : ' disabled'}${x.s === state.start ? ' checked' : ''} aria-label="${aria}"><span>${txt}</span></label>`;
    }).join('');
    const free = list.filter(x => x.ok).length;
    const last = h[1] - dur;
    hint.textContent = `Durata totală: ${durTxt(dur)}. Închidem la ${hhmm(h[1])}, deci ultima oră de început e ${last >= h[0] ? hhmm(Math.floor(last / 60) * 60) : '—'}. ${free} ${free === 1 ? 'interval liber' : 'intervale libere'} în ziua aleasă.`;
  }

  /* ---------- mod (programare / abonament / card cadou) ---------- */
  const TIP = { prog: 'Programare', ab: 'Abonament lunar', card: 'Card cadou' };
  function applyMode() {
    const m = state.mode;
    $$('[data-modes]', form).forEach(el => { el.hidden = !el.dataset.modes.split(' ').includes(m); });
    if (m === 'card') $('#step-car').hidden = !state.card.startsWith('p-');
    $('[data-car-title]').textContent = m === 'card' ? 'Mărimea mașinii (pentru pachet)' : 'Mașina';
    $('[data-when-title]').textContent = m === 'ab' ? 'Prima spălare: ziua și ora' : 'Ziua și ora';
    $('#s-submit').textContent = m === 'ab' ? 'Cere abonamentul' : m === 'card' ? 'Cere cardul cadou' : 'Trimite programarea';
    $('#s-foot').textContent = m === 'card'
      ? 'Nu se plătește pe site. Te sunăm pentru confirmare și plată. Prețuri de exemplu.'
      : m === 'ab' ? 'Plata abonamentului se face lunar, la studio. Prețuri de exemplu.'
        : 'Plata se face la predarea mașinii. Prețuri de exemplu.';
    const r = form.querySelector(`input[name="ui_tip"][value="${m}"]`);
    if (r) r.checked = true;
  }
  function setMode(m) { state.mode = m; applyMode(); renderDays(); renderSlots(); summary(); }

  /* ---------- rezumat ---------- */
  const dayTxt = () => { const d = state.day === null ? null : days[state.day]; return d ? `${ZIUA[d.getDay()]}, ${d.getDate()} ${LUNA[d.getMonth()]}` : '—'; };
  const timeTxt = () => (state.start === null ? 'alege ora' : `${hhmm(state.start)}–${hhmm(state.start + duration())}`);
  const carTxt = () => {
    const extra = [form.elements.marca_model.value.trim(), form.elements.nr_inmatriculare.value.trim().toUpperCase()].filter(Boolean).join(', ');
    return MARIMI[state.size] + (extra ? ` · ${extra}` : '');
  };
  function rows() {
    const m = state.mode;
    if (m === 'ab') {
      const c = abCalc(state.ab, state.size);
      return {
        rows: [['Abonament', ABONAMENTE[state.ab].nume], ['Mașină', carTxt()], ['Prima spălare', `${dayTxt()}, ${timeTxt()}`],
          ['La bucată', lei(c.full)], ['Economisești', `${lei(c.save)} / lună (${c.pct}%)`, 'ok']],
        totalLbl: 'Pe lună', total: total()
      };
    }
    if (m === 'card') {
      const ci = cardInfo(state.card, state.size), dest = form.elements.destinatar.value.trim();
      const r = [['Card cadou', ci.label]];
      if (dest) r.push(['Pentru', dest]);
      r.push(['Valabil', `${CARD_CADOU.valabilitateLuni} luni`], ['Plata', 'la studio sau prin transfer']);
      return { rows: r, totalLbl: 'Valoare', total: total() };
    }
    const ex = state.extras.map(k => EXTRA[k].nume);
    return {
      rows: [['Pachet', PACHETE[state.pack].nume], ['Mașină', carTxt()], ['Extra-uri', ex.length ? ex.join(', ') : '—'],
        ['Ziua', dayTxt()], ['Interval', timeTxt()], ['Durată', durTxt(duration())]],
      totalLbl: 'Total', total: total()
    };
  }
  const fillDl = (dl, list) => {
    dl.replaceChildren();
    list.forEach(([k, v, cls]) => {
      const dt = document.createElement('dt'); dt.textContent = k;
      const dd = document.createElement('dd'); dd.textContent = v; if (cls) dd.className = cls;
      dl.append(dt, dd);
    });
  };
  function summary() {
    const r = rows();
    $('#s-title').textContent = `Rezumat · ${TIP[state.mode].toLowerCase()}`;
    fillDl($('#s-list'), r.rows);
    $('#s-total-lbl').textContent = r.totalLbl;
    $('#s-total').textContent = lei(r.total);
  }
  const summaryText = () => {
    const r = rows();
    return r.rows.map(([k, v]) => `${k}: ${v}`).concat(`${r.totalLbl}: ${lei(r.total)}`).join('\n');
  };

  /* ---------- evenimente ---------- */
  $$('[data-size]').forEach(b => b.addEventListener('click', () => {
    state.size = b.dataset.size; paintPrices(); renderDays(); renderSlots(); summary();
  }));
  $$('[data-pick]').forEach(b => b.addEventListener('click', () => {
    state.pack = b.dataset.pick;
    const r = form.querySelector(`input[name="ui_pachet"][value="${state.pack}"]`); if (r) r.checked = true;
    setMode('prog'); scrollTo('programare');
  }));
  $$('[data-ab-pick]').forEach(b => b.addEventListener('click', () => {
    state.ab = b.dataset.abPick;
    const r = form.querySelector(`input[name="ui_ab"][value="${state.ab}"]`); if (r) r.checked = true;
    setMode('ab'); scrollTo('programare');
  }));
  $$('[data-card-pick]').forEach(b => b.addEventListener('click', () => {
    state.card = b.dataset.cardPick; paintPrices(); setMode('card'); scrollTo('programare');
  }));

  form.addEventListener('change', e => {
    const t = e.target;
    switch (t.name) {
      case 'ui_tip': setMode(t.value); break;
      case 'ui_pachet': state.pack = t.value; renderDays(); renderSlots(); break;
      case 'ui_ab': state.ab = t.value; break;
      case 'ui_card': state.card = t.value; applyMode(); break;
      case 'ui_marime': state.size = t.value; paintPrices(); renderDays(); renderSlots(); break;
      case 'ui_extra': state.extras = $$('input[name="ui_extra"]:checked', form).map(i => i.value); renderDays(); renderSlots(); break;
      case 'ui_zi': state.day = +t.value; state.start = null; renderSlots(); break;
      case 'ui_ora': state.start = +t.value; break;
      default: break;
    }
    if (t.name && t.name.startsWith('ui_')) msg.textContent = '';
    summary();
  });
  form.addEventListener('input', e => { if (['marca_model', 'nr_inmatriculare', 'destinatar'].includes(e.target.name)) summary(); });

  /* ---------- trimitere ---------- */
  function validate() {
    const nume = form.elements.nume, tel = form.elements.telefon;
    let err = '', focus = null;
    if (state.mode !== 'card' && state.start === null) { err = 'Alege ziua și ora de început.'; focus = slotsBox; }
    else if (!nume.value.trim()) { err = 'Scrie numele tău.'; focus = nume; }
    else if (tel.value.replace(/\D/g, '').length < 9) { err = 'Scrie un număr de telefon valid.'; focus = tel; }
    msg.textContent = err;
    if (focus) { if (focus === slotsBox) slotsBox.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' }); else focus.focus(); }
    return !err;
  }
  const FIELDS = ['form-name', 'bot-field', 'tip_cerere', 'pachet', 'marime', 'extra_uri', 'zi', 'ora', 'durata', 'total', 'abonament', 'economie', 'card_cadou',
    'nume', 'telefon', 'nr_inmatriculare', 'marca_model', 'destinatar', 'mesaj', 'rezumat'];
  function payload() {
    const m = state.mode, set = (k, v) => { form.elements[k].value = v; };
    const timed = m !== 'card';
    set('tip_cerere', TIP[m]);
    set('pachet', m === 'prog' ? PACHETE[state.pack].nume : m === 'ab' ? 'Exterior (abonament)' : '');
    set('marime', m === 'card' && !state.card.startsWith('p-') ? '' : MARIMI[state.size]);
    set('extra_uri', m === 'prog' ? state.extras.map(k => `${EXTRA[k].nume} (+${lei(EXTRA[k].pret)}, +${durTxt(EXTRA[k].durata)})`).join('; ') : '');
    set('zi', timed ? dayTxt() : '');
    set('ora', timed ? timeTxt() : '');
    set('durata', timed ? durTxt(duration()) : '');
    set('total', m === 'ab' ? `${lei(total())} / lună` : lei(total()));
    if (m === 'ab') { const c = abCalc(state.ab, state.size); set('abonament', ABONAMENTE[state.ab].nume); set('economie', `${lei(c.save)} / lună (${c.pct}%) față de ${lei(c.full)} la bucată`); }
    else { set('abonament', ''); set('economie', ''); }
    set('card_cadou', m === 'card' ? cardInfo(state.card, state.size).label : '');
    set('rezumat', summaryText());
    const p = new URLSearchParams();
    FIELDS.forEach(k => {
      const el = form.elements[k];
      let v = el ? el.value.trim() : '';
      if (m === 'card' && (k === 'nr_inmatriculare' || k === 'marca_model')) v = '';
      if (m !== 'card' && (k === 'destinatar' || k === 'mesaj')) v = '';
      p.append(k, v);
    });
    return p;
  }

  const panel = $('.panel', form), sum = $('.sum', form), thanks = $('#thanks');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validate()) return;
    const btn = $('#s-submit'), label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Se trimite…';
    try {
      const body = payload().toString();
      const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
      if (!res.ok) throw new Error(res.status);
      const r = rows(), nume = form.elements.nume.value.trim().split(/\s+/)[0], tel = form.elements.telefon.value.trim();
      $('#t-title').textContent = `Mulțumim, ${nume}!`;
      $('#t-text').textContent = state.mode === 'card'
        ? `Am primit cererea pentru cardul cadou. Te sunăm pe ${tel} ca să stabilim plata (la studio sau prin transfer) și cum primești cardul.`
        : state.mode === 'ab'
          ? `Am primit cererea de abonament. Te sunăm pe ${tel} în câteva minute ca să confirmăm prima spălare.`
          : `Am primit programarea. Te sunăm pe ${tel} în câteva minute pentru confirmare. Intervalul rămâne rezervat pentru tine până atunci.`;
      fillDl($('#t-list'), r.rows.concat([[r.totalLbl, lei(r.total)]]));
      panel.hidden = true; sum.hidden = true; thanks.hidden = false;
      thanks.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
      thanks.focus({ preventScroll: true });
    } catch (err) {
      msg.textContent = 'Cererea nu a putut fi trimisă. Încearcă din nou, trimite-o pe WhatsApp sau sună-ne.';
    } finally {
      btn.disabled = false; btn.textContent = label;
    }
  });
  $('#s-wa').addEventListener('click', () => {
    if (!validate()) return;
    const extra = [form.elements.mesaj.value.trim() && state.mode === 'card' ? `Mesaj pe card: ${form.elements.mesaj.value.trim()}` : ''].filter(Boolean);
    const text = [`Bună ziua! ${TIP[state.mode]} la Aqua Noir:`, summaryText(), ...extra,
      `Nume: ${form.elements.nume.value.trim()}`, `Telefon: ${form.elements.telefon.value.trim()}`].join('\n');
    window.open(waUrl(text), '_blank', 'noopener');
  });
  $('#t-again').addEventListener('click', () => {
    ['nume', 'telefon', 'nr_inmatriculare', 'marca_model', 'destinatar', 'mesaj'].forEach(k => { form.elements[k].value = ''; });
    state.start = null; msg.textContent = '';
    thanks.hidden = true; panel.hidden = false; sum.hidden = false;
    renderDays(); renderSlots(); summary();
    scrollTo('programare');
  });

  /* ---------- start ---------- */
  paintPrices();
  // formularul de programare e sub ecranul inițial: îl construim după prima pictare
  requestAnimationFrame(() => setTimeout(() => { applyMode(); renderDays(); renderSlots(); summary(); }, 0));
})();
