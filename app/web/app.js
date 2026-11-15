/* Health · PWA de seguimiento · app.js
 * Sin framework ni build: supabase-js y Chart.js desde CDN.
 */
(() => {
  'use strict';

  const CFG = window.HEALTH_CONFIG;
  const sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_KEY);

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const hoy = () => new Date().toISOString().slice(0, 10);

  const state = {
    user: null,
    deportistas: [],   // fichas accesibles (propia + entrenados)
    dep: null,         // deportista seleccionado
    charts: {},
  };

  // ------------------------------------------------------------------ utilidades
  function toast(txt, ms = 2200) {
    const t = $('#toast');
    t.textContent = txt; t.classList.remove('hidden');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.add('hidden'), ms);
  }
  function msg(id, txt, ok = true) {
    const el = $(id); el.textContent = txt;
    el.className = 'msg ' + (ok ? 'ok' : 'err');
    if (txt) setTimeout(() => { el.textContent = ''; }, 4000);
  }
  function formData(form) {
    const out = {};
    new FormData(form).forEach((v, k) => {
      const input = form.elements[k];
      if (input.type === 'checkbox') return;
      if (v === '') { out[k] = null; return; }
      out[k] = (input.type === 'number') ? Number(v) : v;
    });
    Array.from(form.elements).forEach((el) => { if (el.type === 'checkbox') out[el.name] = el.checked; });
    return out;
  }
  function fillForm(form, row) {
    Array.from(form.elements).forEach((el) => {
      if (!el.name) return;
      const v = row ? row[el.name] : null;
      if (el.type === 'checkbox') el.checked = !!v;
      else el.value = (v === null || v === undefined) ? '' : v;
    });
  }
  function fmtFecha(d) {
    const [y, m, dd] = d.split('-'); return `${dd}/${m}/${y.slice(2)}`;
  }
  function kpis(id, items) {
    $(id).innerHTML = items.map(([v, l]) => `<div class="kpi"><b>${v ?? '—'}</b><span>${l}</span></div>`).join('');
  }
  function err(e) { console.error(e); return e?.message || String(e); }
  function banner(txt) {
    const b = $('#banner'); b.textContent = txt || ''; b.classList.toggle('hidden', !txt);
  }
  // Envuelve un manejador de formulario: exige ficha y muestra cualquier excepción en pantalla
  function guard(msgId, fn) {
    return async (e) => {
      e.preventDefault();
      if (!state.dep) return msg(msgId, 'No hay ficha de deportista; revisa el aviso superior.', false);
      const btn = e.target.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      try { await fn(e); }
      catch (ex) { msg(msgId, 'Error: ' + err(ex), false); }
      finally { if (btn) btn.disabled = false; }
    };
  }

  // ------------------------------------------------------------------ auth
  async function initAuth() {
    const { data: { session } } = await sb.auth.getSession();
    await onSession(session);
    sb.auth.onAuthStateChange((_evt, s) => onSession(s));
  }

  async function onSession(session) {
    state.user = session?.user || null;
    if (!state.user) {
      $('#app').classList.add('hidden'); $('#auth').classList.remove('hidden');
      return;
    }
    $('#auth').classList.add('hidden'); $('#app').classList.remove('hidden');
    await cargarDeportistas();
  }

  $('#auth-form').addEventListener('submit', (e) => { e.preventDefault(); auth('login'); });
  $('#auth-form [data-action="signup"]').addEventListener('click', () => auth('signup'));

  async function auth(mode) {
    const f = $('#auth-form');
    const email = f.email.value.trim(), password = f.password.value;
    f.querySelectorAll('button').forEach((b) => b.disabled = true);
    try {
      if (mode === 'signup') {
        const { data, error } = await sb.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) msg('#auth-msg', 'Cuenta creada.');
        else msg('#auth-msg', 'Cuenta creada. Revisa tu email para confirmarla y después entra.');
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e) { msg('#auth-msg', err(e), false); }
    finally { f.querySelectorAll('button').forEach((b) => b.disabled = false); }
  }

  $('#btn-logout').addEventListener('click', async () => { await sb.auth.signOut(); location.reload(); });

  // ------------------------------------------------------------------ deportistas
  async function cargarDeportistas() {
    banner('');
    let { data, error } = await sb.from('deportistas').select('*').order('nombre');
    if (error) {
      banner('No se puede leer la base de datos: ' + err(error) +
        '\n¿Está ejecutado app/supabase/schema.sql en el SQL Editor de Supabase?');
      return;
    }
    // Si el usuario no tiene ficha propia (cuenta creada antes del esquema), la creamos aquí
    if (!(data || []).some((d) => d.user_id === state.user.id)) {
      const nueva = { user_id: state.user.id, email: state.user.email, nombre: state.user.email.split('@')[0] };
      const { error: eIns } = await sb.from('deportistas').insert(nueva);
      if (eIns) {
        banner('Tu usuario no tiene ficha de deportista y no se ha podido crear: ' + err(eIns) +
          '\nSolución: vuelve a ejecutar app/supabase/schema.sql en Supabase y recarga la app.');
        return;
      }
      ({ data } = await sb.from('deportistas').select('*').order('nombre'));
      toast('Ficha de deportista creada');
    }
    state.deportistas = data || [];
    const sel = $('#sel-deportista');
    sel.innerHTML = state.deportistas.map((d) => {
      const propio = d.user_id === state.user.id;
      return `<option value="${d.id}">${d.nombre || d.email || 'Sin nombre'}${propio ? ' (yo)' : ''}</option>`;
    }).join('');
    sel.classList.toggle('hidden', state.deportistas.length <= 1);
    const guardado = localStorage.getItem('health.dep');
    const propio = state.deportistas.find((d) => d.user_id === state.user.id);
    state.dep = state.deportistas.find((d) => d.id === guardado) || propio || state.deportistas[0] || null;
    if (!state.dep) { banner('No hay ficha de deportista. Ejecuta app/supabase/schema.sql en Supabase y recarga.'); return; }
    sel.value = state.dep.id;
    await refrescarTodo();
  }
  $('#sel-deportista').addEventListener('change', async (e) => {
    state.dep = state.deportistas.find((d) => d.id === e.target.value);
    try { localStorage.setItem('health.dep', state.dep.id); } catch {}
    await refrescarTodo();
  });

  async function refrescarTodo() {
    $('#hoy-fecha').value = $('#hoy-fecha').value || hoy();
    $('#nutri-fecha').value = $('#nutri-fecha').value || hoy();
    $('#form-sesion').fecha.value = $('#form-sesion').fecha.value || hoy();
    fillForm($('#form-perfil'), state.dep);
    $('#info-version').textContent = `Health v${CFG.APP_VERSION} · ${state.user.email}`;
    await Promise.all([cargarDiario(), cargarPlanHoy(), cargarSesiones(), cargarNutri()]);
    if (!$('#tab-evo').classList.contains('hidden')) await cargarEvolucion();
  }

  // ------------------------------------------------------------------ tabs
  $$('.tabbar button').forEach((b) => b.addEventListener('click', async () => {
    $$('.tabbar button').forEach((x) => x.classList.toggle('active', x === b));
    $$('.tab').forEach((t) => t.classList.toggle('hidden', t.id !== 'tab-' + b.dataset.tab));
    if (b.dataset.tab === 'evo') await cargarEvolucion();
  }));

  // ------------------------------------------------------------------ registro diario
  async function cargarDiario() {
    const fecha = $('#hoy-fecha').value;
    const { data } = await sb.from('registro_diario').select('*')
      .eq('deportista_id', state.dep.id).eq('fecha', fecha).maybeSingle();
    fillForm($('#form-diario'), data);
  }
  $('#hoy-fecha').addEventListener('change', cargarDiario);
  $('#form-diario').addEventListener('submit', guard('#diario-msg', async (e) => {
    const row = { ...formData(e.target), deportista_id: state.dep.id, fecha: $('#hoy-fecha').value || hoy() };
    const { error } = await sb.from('registro_diario').upsert(row, { onConflict: 'deportista_id,fecha' });
    if (error) return msg('#diario-msg', err(error), false);
    msg('#diario-msg', 'Guardado'); toast('Registro diario guardado');
  }));

  async function cargarPlanHoy() {
    const { data } = await sb.from('sesion_planificada').select('*')
      .eq('deportista_id', state.dep.id).eq('fecha', $('#hoy-fecha').value).order('creado_en');
    const ul = $('#plan-hoy');
    if (!data?.length) { ul.innerHTML = '<li class="empty">Sin sesión planificada para este día</li>'; return; }
    ul.innerHTML = data.map((s) => `<li><div><b>${s.nombre}</b><div class="sub">${s.tipo} · ${s.duracion_prevista_min ?? '?'} min · ${s.intensidad_objetivo ?? ''}</div></div>
      <button data-plan="${s.id}">Registrar</button></li>`).join('');
    ul.querySelectorAll('[data-plan]').forEach((b) => b.addEventListener('click', () => {
      const s = data.find((x) => x.id === b.dataset.plan);
      const f = $('#form-sesion');
      f.fecha.value = s.fecha; f.nombre.value = s.nombre; f.tipo.value = s.tipo;
      f.duracion_min.value = s.duracion_prevista_min ?? '';
      f.dataset.plan = s.id;
      $('.tabbar [data-tab="sesion"]').click();
    }));
  }

  // ------------------------------------------------------------------ sesiones
  async function cargarSesiones() {
    const { data } = await sb.from('sesion_realizada').select('*')
      .eq('deportista_id', state.dep.id).order('fecha', { ascending: false }).order('creado_en', { ascending: false }).limit(15);
    const ul = $('#lista-sesiones');
    if (!data?.length) { ul.innerHTML = '<li class="empty">Todavía no hay sesiones</li>'; return; }
    ul.innerHTML = data.map((s) => `<li><div><b>${fmtFecha(s.fecha)} · ${s.nombre ?? s.tipo}</b>
      <div class="sub">${s.estado} · ${s.duracion_min ?? '?'} min · RPE ${s.rpe ?? '?'} · carga ${s.carga_srpe}${s.distancia_km ? ' · ' + s.distancia_km + ' km' : ''}</div></div>
      <button data-del="${s.id}" title="Borrar">✕</button></li>`).join('');
    ul.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
      const { error } = await sb.from('sesion_realizada').delete().eq('id', b.dataset.del);
      if (error) return toast(err(error));
      toast('Sesión borrada'); cargarSesiones();
    }));
  }
  $('#form-sesion').addEventListener('submit', guard('#sesion-msg', async (e) => {
    const f = e.target;
    const row = { ...formData(f), deportista_id: state.dep.id, sesion_planificada_id: f.dataset.plan || null };
    const { error } = await sb.from('sesion_realizada').insert(row);
    if (error) return msg('#sesion-msg', err(error), false);
    msg('#sesion-msg', 'Sesión guardada'); toast('Sesión guardada');
    delete f.dataset.plan;
    ['nombre', 'duracion_min', 'rpe', 'distancia_km', 'fc_media', 'fc_max', 'notas'].forEach((k) => f[k].value = '');
    cargarSesiones();
  }));

  // ------------------------------------------------------------------ nutrición
  async function cargarNutri() {
    const fecha = $('#nutri-fecha').value;
    const [{ data: reg }, { data: plan }] = await Promise.all([
      sb.from('registro_nutricion').select('*').eq('deportista_id', state.dep.id).eq('fecha', fecha).maybeSingle(),
      sb.from('plan_nutricional').select('*').eq('deportista_id', state.dep.id)
        .lte('vigente_desde', fecha).or(`vigente_hasta.is.null,vigente_hasta.gte.${fecha}`)
        .order('vigente_desde', { ascending: false }).limit(1).maybeSingle(),
    ]);
    fillForm($('#form-nutri'), reg);
    state.planNutri = plan;
    mostrarObjetivoNutri();
  }
  function mostrarObjetivoNutri() {
    const tipo = $('#form-nutri').tipo_dia.value;
    const o = state.planNutri?.objetivos_json?.[tipo];
    $('#nutri-objetivo').textContent = o
      ? `Objetivo (${tipo}): ${o.kcal} kcal · P ${o.prot} g · CH ${o.ch} g · G ${o.grasa} g`
      : (state.planNutri ? 'Elige el tipo de día para ver el objetivo' : 'Sin plan nutricional cargado todavía');
  }
  $('#nutri-fecha').addEventListener('change', cargarNutri);
  $('#form-nutri').tipo_dia.addEventListener('change', mostrarObjetivoNutri);
  $('#form-nutri').addEventListener('submit', guard('#nutri-msg', async (e) => {
    const row = { ...formData(e.target), deportista_id: state.dep.id, fecha: $('#nutri-fecha').value || hoy() };
    const { error } = await sb.from('registro_nutricion').upsert(row, { onConflict: 'deportista_id,fecha' });
    if (error) return msg('#nutri-msg', err(error), false);
    msg('#nutri-msg', 'Guardado'); toast('Nutrición guardada');
  }));

  // ------------------------------------------------------------------ evolución
  function chart(id, cfg) {
    if (state.charts[id]) state.charts[id].destroy();
    const css = getComputedStyle(document.documentElement);
    Chart.defaults.color = css.getPropertyValue('--muted').trim();
    Chart.defaults.borderColor = css.getPropertyValue('--border').trim();
    state.charts[id] = new Chart($(id), cfg);
  }
  async function cargarEvolucion() {
    const css = getComputedStyle(document.documentElement);
    const primary = css.getPropertyValue('--primary').trim();
    const desde60 = new Date(Date.now() - 59 * 864e5).toISOString().slice(0, 10);
    const desde30 = new Date(Date.now() - 29 * 864e5).toISOString().slice(0, 10);

    const [{ data: peso }, { data: carga }, { data: nutri }, { data: acwr }] = await Promise.all([
      sb.from('v_peso_media_7d').select('*').eq('deportista_id', state.dep.id).gte('fecha', desde60).order('fecha'),
      sb.from('v_carga_semanal').select('*').eq('deportista_id', state.dep.id).order('semana', { ascending: false }).limit(12),
      sb.from('registro_nutricion').select('kcal,proteina_g,carbohidratos_g,grasas_g,adherencia').eq('deportista_id', state.dep.id).gte('fecha', desde30),
      sb.from('v_acwr').select('*').eq('deportista_id', state.dep.id).maybeSingle(),
    ]);

    // Peso
    const p = peso || [];
    const ult = p.at(-1), prim = p[0];
    kpis('#kpi-peso', [
      [ult?.peso_kg, 'último'], [ult?.media_7d, 'media 7 d'],
      [ult && prim ? (ult.media_7d - prim.media_7d).toFixed(2) : null, 'Δ periodo (kg)'],
    ]);
    chart('#chart-peso', {
      type: 'line',
      data: { labels: p.map((r) => fmtFecha(r.fecha)), datasets: [
        { label: 'Peso', data: p.map((r) => r.peso_kg), pointRadius: 2, borderWidth: 1, borderColor: primary + '66' },
        { label: 'Media 7 d', data: p.map((r) => r.media_7d), pointRadius: 0, borderWidth: 2.5, borderColor: primary, tension: 0.3 },
      ] },
      options: { responsive: true, plugins: { legend: { display: true } }, scales: { x: { ticks: { maxTicksLimit: 6 } } } },
    });

    // Carga
    const c = (carga || []).slice().reverse();
    const semanaActual = c.at(-1);
    kpis('#kpi-carga', [
      [semanaActual?.carga, 'carga semana'], [semanaActual?.completas, 'sesiones completas'],
      [acwr?.acwr, 'ACWR (0,8-1,3)'],
    ]);
    chart('#chart-carga', {
      type: 'bar',
      data: { labels: c.map((r) => fmtFecha(r.semana)), datasets: [{ label: 'Carga sRPE', data: c.map((r) => r.carga), backgroundColor: primary }] },
      options: { responsive: true, plugins: { legend: { display: false } } },
    });

    // Nutrición
    const n = nutri || [];
    const avg = (k) => n.length ? Math.round(n.reduce((a, r) => a + (r[k] || 0), 0) / n.filter((r) => r[k] != null).length || 0) : null;
    kpis('#kpi-nutri', [[n.length, 'días registrados'], [avg('kcal'), 'kcal media'], [avg('proteina_g'), 'prot g media'], [avg('adherencia'), 'adherencia %']]);
  }

  // ------------------------------------------------------------------ perfil y exportación
  $('#form-perfil').addEventListener('submit', guard('#perfil-msg', async (e) => {
    const { error } = await sb.from('deportistas').update(formData(e.target)).eq('id', state.dep.id);
    if (error) return msg('#perfil-msg', err(error), false);
    msg('#perfil-msg', 'Perfil guardado'); await cargarDeportistas();
  }));

  $$('[data-export]').forEach((b) => b.addEventListener('click', async () => {
    const tabla = b.dataset.export;
    const { data, error } = await sb.from(tabla).select('*').eq('deportista_id', state.dep.id).order('fecha');
    if (error) return toast(err(error));
    if (!data?.length) return toast('Sin datos que exportar');
    const cols = Object.keys(data[0]);
    const esc = (v) => v == null ? '' : `"${String(typeof v === 'object' ? JSON.stringify(v) : v).replace(/"/g, '""')}"`;
    const csv = [cols.join(';'), ...data.map((r) => cols.map((k) => esc(r[k])).join(';'))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `${tabla}_${hoy()}.csv`; a.click();
  }));

  // ------------------------------------------------------------------ service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('SW no registrado', e));
  }

  initAuth();
})();
