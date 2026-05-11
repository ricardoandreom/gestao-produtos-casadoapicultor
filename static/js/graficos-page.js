'use strict';

let todasEncomendas = [];
const GB_CAMPOS = ['g1-produto','g2-tipo','g2-cliente','g3-tipo','g3-cliente','g4-tipo','g4-cliente','g4-produto'];
const gbOpcoes = {};

function gbGetValores(key) {
  const s = new Set();
  todasEncomendas.forEach(e => {
    if      (key.endsWith('-produto')) e.produtos.forEach(p => s.add(p.nome));
    else if (key.endsWith('-tipo'))    s.add(e.cliente_tipo);
    else if (key.endsWith('-cliente')) s.add(e.cliente);
  });
  return [...s].sort((a, b) => a.localeCompare(b, 'pt'));
}

function gbInicializar(key) {
  const valores = gbGetValores(key);
  const lst = document.getElementById('glst-' + key);
  lst.innerHTML = '';
  gbOpcoes[key] = [];
  valores.forEach(val => {
    const entry = { val, checked: true };
    gbOpcoes[key].push(entry);
    const div = document.createElement('div');
    div.className = 'ms-opt';
    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.checked = true;
    cb.addEventListener('change', () => { entry.checked = cb.checked; gbAtualizarLabel(key); gbRenderForKey(key); });
    const span = document.createElement('span');
    span.textContent = val; span.title = val;
    div.appendChild(cb); div.appendChild(span);
    lst.appendChild(div);
  });
  gbAtualizarLabel(key);
}

function gbPesquisar(key, q) {
  const lq = q.toLowerCase();
  document.querySelectorAll(`#glst-${key} .ms-opt`).forEach(d =>
    d.classList.toggle('hidden', !d.querySelector('span').textContent.toLowerCase().includes(lq)));
}

function gbAbrir(key) {
  const isOpen = document.getElementById('gpan-' + key).classList.contains('open');
  GB_CAMPOS.forEach(k => {
    document.getElementById('gpan-' + k)?.classList.remove('open');
    document.getElementById('gtrig-' + k)?.classList.remove('open');
    const si = document.querySelector(`#gpan-${k} .ms-search`);
    if (si) { si.value = ''; gbPesquisar(k, ''); }
  });
  if (!isOpen) {
    document.getElementById('gpan-' + key).classList.add('open');
    document.getElementById('gtrig-' + key).classList.add('open');
    const si = document.querySelector(`#gpan-${key} .ms-search`);
    if (si) setTimeout(() => si.focus(), 40);
  }
}

document.addEventListener('click', e => {
  if (!e.target.closest('.gb-fi')) {
    GB_CAMPOS.forEach(k => {
      document.getElementById('gpan-' + k)?.classList.remove('open');
      document.getElementById('gtrig-' + k)?.classList.remove('open');
    });
  }
});

function gbSelectAll(key) {
  gbOpcoes[key]?.forEach(e => e.checked = true);
  document.querySelectorAll(`#glst-${key} .ms-opt input`).forEach(cb => cb.checked = true);
  gbAtualizarLabel(key); gbRenderForKey(key);
}

function gbLimpar(key) {
  gbOpcoes[key]?.forEach(e => e.checked = false);
  document.querySelectorAll(`#glst-${key} .ms-opt input`).forEach(cb => cb.checked = false);
  gbAtualizarLabel(key); gbRenderForKey(key);
}

function gbRenderForKey(key) {
  const n = key[1];
  if (n==='1') renderG1(); else if (n==='2') renderG2(); else if (n==='3') renderG3(); else if (n==='4') renderG4();
}

function gbAtualizarLabel(key) {
  const opts = gbOpcoes[key] || [];
  const sel = opts.filter(e => e.checked);
  const lbl = document.getElementById('glbl-' + key);
  const trig = document.getElementById('gtrig-' + key);
  if (!lbl) return;
  if (sel.length === 0) { lbl.textContent = '(nenhum)'; trig.classList.add('active'); }
  else if (sel.length === opts.length) { lbl.textContent = 'Todos'; trig.classList.remove('active'); }
  else if (sel.length === 1) { lbl.textContent = sel[0].val; trig.classList.add('active'); }
  else { lbl.textContent = `${sel.length} selecionados`; trig.classList.add('active'); }
}

function parseDataPT(str) { const [d,m,y] = str.split('/').map(Number); return new Date(y,m-1,d); }
function parseDataInput(str) { if (!str) return null; const [y,m,d] = str.split('-').map(Number); return new Date(y,m-1,d); }

function gbFiltrarEncomendas(deId, ateId, filtros) {
  const de = parseDataInput(document.getElementById(deId).value);
  const ate = parseDataInput(document.getElementById(ateId).value);
  return todasEncomendas.filter(e => {
    const dt = parseDataPT(e.data);
    if (de && dt < de) return false;
    if (ate && dt > ate) return false;
    for (const [key, campo] of Object.entries(filtros)) {
      const opts = gbOpcoes[key];
      if (!opts) continue;
      const pass = new Set(opts.filter(o => o.checked).map(o => o.val));
      if (campo === 'tipo'    && !pass.has(e.cliente_tipo)) return false;
      if (campo === 'cliente' && !pass.has(e.cliente))      return false;
      if (campo === 'produto' && !e.produtos.some(p => pass.has(p.nome))) return false;
    }
    return true;
  });
}

const CHART_OPTS_BASE = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#f0ece0', font: { family: 'Inter', size: 11 }, boxWidth: 14 } },
    tooltip: { backgroundColor: '#1a1916', borderColor: '#2e2c25', borderWidth: 1, titleColor: '#e8b84b', bodyColor: '#f0ece0', titleFont: { family: 'DM Mono', size: 11 }, bodyFont: { family: 'Inter', size: 12 }, padding: 12 }
  }
};

let chart1=null, chart2=null, chart3=null, chart4=null;

function renderG1() {
  const enc = gbFiltrarEncomendas('g1-de','g1-ate',{'g1-produto':'produto'});
  const wrap = document.getElementById('grafico1').parentElement;
  const empty = document.getElementById('gempty1');
  if (!enc.length) { wrap.style.display='none'; empty.style.display='block'; if(chart1){chart1.destroy();chart1=null;} return; }
  wrap.style.display='block'; empty.style.display='none';
  const contagem = {};
  enc.forEach(e => { contagem[e.cliente_tipo] = (contagem[e.cliente_tipo]||0) + 1; });
  const labels = Object.keys(contagem);
  const data = labels.map(l => contagem[l]);
  const cores = labels.map(l => l==='AM' ? 'rgba(232,184,75,0.85)' : 'rgba(76,175,131,0.85)');
  const coresBorder = labels.map(l => l==='AM' ? '#e8b84b' : '#4caf83');
  if (chart1) chart1.destroy();
  chart1 = new Chart(document.getElementById('grafico1').getContext('2d'), {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: cores, borderColor: coresBorder, borderWidth: 2, hoverOffset: 6 }] },
    options: { ...CHART_OPTS_BASE, cutout: '60%', plugins: { ...CHART_OPTS_BASE.plugins, tooltip: { ...CHART_OPTS_BASE.plugins.tooltip, callbacks: { label: i => `  ${i.label}: ${i.raw} encomenda${i.raw!==1?'s':''}` } } } }
  });
}

function renderG2() {
  const enc = gbFiltrarEncomendas('g2-de','g2-ate',{'g2-tipo':'tipo','g2-cliente':'cliente'});
  const wrap = document.getElementById('grafico2').parentElement;
  const empty = document.getElementById('gempty2');
  if (!enc.length) { wrap.style.display='none'; empty.style.display='block'; if(chart2){chart2.destroy();chart2=null;} return; }
  const soma = {};
  enc.forEach(e => e.produtos.forEach(p => { soma[p.nome] = (soma[p.nome]||0) + p.quantidade; }));
  const sorted = Object.entries(soma).sort((a,b) => b[1]-a[1]).slice(0,3);
  if (!sorted.length) { wrap.style.display='none'; empty.style.display='block'; return; }
  wrap.style.display='block'; empty.style.display='none';
  const labels = sorted.map(s => s[0]);
  const data = sorted.map(s => s[1]);
  const CORES = ['rgba(232,184,75,0.85)','rgba(91,156,246,0.85)','rgba(76,175,131,0.85)'];
  const BORDER = ['#e8b84b','#5b9cf6','#4caf83'];
  if (chart2) chart2.destroy();
  chart2 = new Chart(document.getElementById('grafico2').getContext('2d'), {
    type: 'bar',
    data: { labels, datasets: [{ data, backgroundColor: CORES.slice(0,labels.length), borderColor: BORDER.slice(0,labels.length), borderWidth: 2, borderRadius: 6 }] },
    options: { ...CHART_OPTS_BASE, indexAxis: 'y', plugins: { ...CHART_OPTS_BASE.plugins, legend: { display: false }, tooltip: { ...CHART_OPTS_BASE.plugins.tooltip, callbacks: { label: i => `  ${i.raw} unidade${i.raw!==1?'s':''}` } } }, scales: { x: { grid: { color: '#2e2c25' }, ticks: { color: '#7a776a', font: { family: 'DM Mono', size: 10 }, stepSize: 1, precision: 0 }, border: { color: '#2e2c25' }, beginAtZero: true }, y: { grid: { color: 'transparent' }, ticks: { color: '#f0ece0', font: { family: 'Inter', size: 12 } }, border: { color: '#2e2c25' } } } }
  });
}

function renderG3() {
  const enc = gbFiltrarEncomendas('g3-de','g3-ate',{'g3-tipo':'tipo','g3-cliente':'cliente'});
  const wrap = document.getElementById('grafico3').parentElement;
  const empty = document.getElementById('gempty3');
  if (!enc.length) { wrap.style.display='none'; empty.style.display='block'; if(chart3){chart3.destroy();chart3=null;} return; }
  const meses = {};
  enc.forEach(e => { const [d,m,y] = e.data.split('/'); const mes = `${y}-${m}`; meses[mes] = (meses[mes]||0) + 1; });
  const labels = Object.keys(meses).sort();
  const labelsF = labels.map(l => { const [y,m] = l.split('-'); return `${m}/${y}`; });
  const data = labels.map(l => meses[l]);
  wrap.style.display='block'; empty.style.display='none';
  if (chart3) chart3.destroy();
  chart3 = new Chart(document.getElementById('grafico3').getContext('2d'), {
    type: 'line',
    data: { labels: labelsF, datasets: [{ label: 'Encomendas', data, borderColor: '#5b9cf6', backgroundColor: 'rgba(91,156,246,0.08)', borderWidth: 2.5, pointBackgroundColor: '#5b9cf6', pointRadius: 4, pointHoverRadius: 6, tension: 0.35, fill: true }] },
    options: { ...CHART_OPTS_BASE, plugins: { ...CHART_OPTS_BASE.plugins, legend: { display: false }, tooltip: { ...CHART_OPTS_BASE.plugins.tooltip, callbacks: { label: i => `  ${i.raw} encomenda${i.raw!==1?'s':''}` } } }, scales: { x: { grid: { color: '#2e2c25' }, ticks: { color: '#7a776a', font: { family: 'DM Mono', size: 10 } }, border: { color: '#2e2c25' } }, y: { grid: { color: '#2e2c25' }, ticks: { color: '#7a776a', font: { family: 'DM Mono', size: 10 }, stepSize: 1, precision: 0 }, border: { color: '#2e2c25' }, beginAtZero: true } } }
  });
}

function renderG4() {
  const enc = gbFiltrarEncomendas('g4-de','g4-ate',{'g4-tipo':'tipo','g4-cliente':'cliente','g4-produto':'produto'});
  const wrap = document.getElementById('grafico4').parentElement;
  const empty = document.getElementById('gempty4');
  if (!enc.length) { wrap.style.display='none'; empty.style.display='block'; if(chart4){chart4.destroy();chart4=null;} return; }
  const meses = {};
  enc.forEach(e => {
    const [d,m,y] = e.data.split('/'); const mes = `${y}-${m}`;
    const passaProduto = gbOpcoes['g4-produto'] ? new Set(gbOpcoes['g4-produto'].filter(o => o.checked).map(o => o.val)) : null;
    e.produtos.forEach(p => { if (passaProduto && !passaProduto.has(p.nome)) return; meses[mes] = (meses[mes]||0) + p.quantidade; });
  });
  const labels = Object.keys(meses).sort();
  if (!labels.length) { wrap.style.display='none'; empty.style.display='block'; return; }
  const labelsF = labels.map(l => { const [y,m] = l.split('-'); return `${m}/${y}`; });
  const data = labels.map(l => meses[l]);
  wrap.style.display='block'; empty.style.display='none';
  if (chart4) chart4.destroy();
  chart4 = new Chart(document.getElementById('grafico4').getContext('2d'), {
    type: 'line',
    data: { labels: labelsF, datasets: [{ label: 'Unidades', data, borderColor: '#e8b84b', backgroundColor: 'rgba(232,184,75,0.08)', borderWidth: 2.5, pointBackgroundColor: '#e8b84b', pointRadius: 4, pointHoverRadius: 6, tension: 0.35, fill: true }] },
    options: { ...CHART_OPTS_BASE, plugins: { ...CHART_OPTS_BASE.plugins, legend: { display: false }, tooltip: { ...CHART_OPTS_BASE.plugins.tooltip, callbacks: { label: i => `  ${i.raw} unidade${i.raw!==1?'s':''}` } } }, scales: { x: { grid: { color: '#2e2c25' }, ticks: { color: '#7a776a', font: { family: 'DM Mono', size: 10 } }, border: { color: '#2e2c25' } }, y: { grid: { color: '#2e2c25' }, ticks: { color: '#7a776a', font: { family: 'DM Mono', size: 10 }, stepSize: 1, precision: 0 }, border: { color: '#2e2c25' }, beginAtZero: true } } }
  });
}

async function init() {
  const res = await fetch('/api/encomendas');
  todasEncomendas = await res.json();
  GB_CAMPOS.forEach(k => gbInicializar(k));
  renderG1(); renderG2(); renderG3(); renderG4();
}

init();
