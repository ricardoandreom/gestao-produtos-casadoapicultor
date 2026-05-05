'use strict';

// ── ESTADO GLOBAL ──────────────────────────────────
let tipoSelecionado = 'AM';
let todasEncomendas = [];

// ── FORM ───────────────────────────────────────────
function selecionarTipo(tipo) {
  tipoSelecionado = tipo;
  document.querySelectorAll('.tipo-btn').forEach(b => b.classList.toggle('active', b.dataset.tipo === tipo));
}

function adicionarProduto(nome = '', qty = '', notas = '') {
  const lista = document.getElementById('produtos-lista');
  const row = document.createElement('div');
  row.className = 'produto-row';
  row.innerHTML = `
    <div class="produto-wrap">
      <input type="text" placeholder="Nome do produto" value="${nome}" class="prod-nome"/>
      <textarea class="prod-notas" placeholder="Notas (opcional)...">${notas}</textarea>
    </div>
    <input type="number" placeholder="Qtd" min="1" value="${qty}" class="prod-qty" style="align-self:start;"/>
    <button class="btn-remove" onclick="this.closest('.produto-row').remove()">✕</button>
  `;
  lista.appendChild(row);
  row.querySelector('.prod-nome').focus();
}

async function submeterEncomenda() {
  const cliente = document.getElementById('cliente').value.trim();
  if (!cliente) return toast('Preenche o nome do cliente.', true);
  const rows = document.querySelectorAll('.produto-row');
  const produtos = [];
  for (const row of rows) {
    const nome  = row.querySelector('.prod-nome').value.trim();
    const qty   = parseInt(row.querySelector('.prod-qty').value);
    const notas = row.querySelector('.prod-notas').value.trim();
    if (!nome) return toast('Preenche o nome de todos os produtos.', true);
    if (!qty || qty < 1) return toast('A quantidade deve ser pelo menos 1.', true);
    produtos.push({ nome, quantidade: qty, notas: notas || '' });
  }
  if (!produtos.length) return toast('Adiciona pelo menos um produto.', true);
  const btn = document.getElementById('btn-submit');
  btn.disabled = true; btn.textContent = 'A gerar...';
  try {
    const res  = await fetch('/api/encomendas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cliente, cliente_tipo: tipoSelecionado, produtos }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Erro desconhecido.');
    toast(data.mensagem);
    document.getElementById('cliente').value = '';
    document.getElementById('produtos-lista').innerHTML = '';
    adicionarProduto();
    await carregarHistorico();
  } catch (e) { toast(e.message, true); }
  finally { btn.disabled = false; btn.textContent = 'Gerar Encomenda'; }
}

// ── MULTISELECT FILTROS ────────────────────────────
// Arquitectura simples:
//   - msOpcoes[campo] = array de {val, checked} — fonte de verdade
//   - Os checkboxes no DOM lêem e escrevem directamente em msOpcoes
//   - "sem filtro" = todos checked; "filtro activo" = pelo menos um desmarcado
//   - Limpar = desmarcar todos; Sel. todos = marcar todos
//   - O filtro da tabela verifica se checked=true para incluir

const CAMPOS = ['id','data','cliente','tipo','produto'];
const msOpcoes = { id: [], data: [], cliente: [], tipo: [], produto: [] };

function msGetValores(campo) {
  const s = new Set();
  todasEncomendas.forEach(e => {
    if      (campo === 'id')      s.add(String(e.id).padStart(4,'0'));
    else if (campo === 'data')    s.add(e.data);
    else if (campo === 'cliente') s.add(e.cliente);
    else if (campo === 'tipo')    s.add(e.cliente_tipo);
    else if (campo === 'produto') e.produtos.forEach(p => s.add(p.nome));
  });
  return [...s].sort((a, b) => {
    if (campo === 'id') return Number(a) - Number(b);
    if (campo === 'data') {
      const p = x => { const [d,m,y] = x.split('/').map(Number); return new Date(y,m-1,d); };
      return p(a) - p(b);
    }
    return a.localeCompare(b, 'pt');
  });
}

// Chamado uma vez quando os dados chegam — constrói os checkboxes e NÃO os volta a construir
function msInicializar(campo) {
  const valores = msGetValores(campo);
  const lst = document.getElementById('lst-' + campo);
  lst.innerHTML = '';
  msOpcoes[campo] = [];

  valores.forEach((val, i) => {
    const entry = { val, checked: true }; // começa tudo marcado
    msOpcoes[campo].push(entry);

    const div = document.createElement('div');
    div.className = 'ms-opt';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = true;
    cb.addEventListener('change', () => {
      entry.checked = cb.checked; // sincronizar estado
      msAtualizarLabel(campo);
      aplicarFiltros();
    });
    const span = document.createElement('span');
    span.textContent = val;
    span.title = val;
    div.appendChild(cb);
    div.appendChild(span);
    lst.appendChild(div);
  });

  msAtualizarLabel(campo);
}

function msPesquisar(campo, q) {
  const lq = q.toLowerCase();
  document.querySelectorAll(`#lst-${campo} .ms-opt`).forEach(d => {
    d.classList.toggle('hidden', !d.querySelector('span').textContent.toLowerCase().includes(lq));
  });
}

function msAbrir(campo) {
  const isOpen = document.getElementById('pan-' + campo).classList.contains('open');
  // fechar todos
  CAMPOS.forEach(c => {
    document.getElementById('pan-' + c).classList.remove('open');
    document.getElementById('trig-' + c).classList.remove('open');
    const si = document.querySelector(`#pan-${c} .ms-search`);
    if (si) { si.value = ''; msPesquisar(c, ''); }
  });
  if (!isOpen) {
    document.getElementById('pan-' + campo).classList.add('open');
    document.getElementById('trig-' + campo).classList.add('open');
    const si = document.querySelector(`#pan-${campo} .ms-search`);
    if (si) setTimeout(() => si.focus(), 40);
  }
}

document.addEventListener('click', e => {
  if (!e.target.closest('.filtro-item')) {
    CAMPOS.forEach(c => {
      document.getElementById('pan-' + c)?.classList.remove('open');
      document.getElementById('trig-' + c)?.classList.remove('open');
    });
  }
});

// Selecionar todos — marca todas as checkboxes
function msSelectAll(campo) {
  msOpcoes[campo].forEach(entry => entry.checked = true);
  document.querySelectorAll(`#lst-${campo} .ms-opt input`).forEach(cb => cb.checked = true);
  msAtualizarLabel(campo);
  aplicarFiltros();
}

// Limpar — desmarca todas as checkboxes
function msLimpar(campo) {
  msOpcoes[campo].forEach(entry => entry.checked = false);
  document.querySelectorAll(`#lst-${campo} .ms-opt input`).forEach(cb => cb.checked = false);
  msAtualizarLabel(campo);
  aplicarFiltros();
}

function msLimparTudo() {
  CAMPOS.forEach(c => msLimpar(c));
}

function msSelecionarTudo() {
  CAMPOS.forEach(c => msSelectAll(c));
}

function msAtualizarLabel(campo) {
  const sel = msOpcoes[campo].filter(e => e.checked);
  const tot = msOpcoes[campo].length;
  const lbl = document.getElementById('tlbl-' + campo);
  const trig = document.getElementById('trig-' + campo);
  if (sel.length === 0) {
    lbl.textContent = '(nenhum)';
    trig.classList.add('active');
  } else if (sel.length === tot) {
    lbl.textContent = campo === 'data' ? 'Todas' : 'Todos';
    trig.classList.remove('active');
  } else if (sel.length === 1) {
    lbl.textContent = sel[0].val;
    trig.classList.add('active');
  } else {
    lbl.textContent = `${sel.length} selecionados`;
    trig.classList.add('active');
  }
}

// ── FILTROS + RENDER ───────────────────────────────
function aplicarFiltros() {
  // Para cada campo, quais os valores que passam?
  const pass = {};
  CAMPOS.forEach(c => {
    pass[c] = new Set(msOpcoes[c].filter(e => e.checked).map(e => e.val));
  });

  const filtradas = todasEncomendas.filter(e => {
    if (!pass.id.has(String(e.id).padStart(4,'0')))             return false;
    if (!pass.data.has(e.data))                                  return false;
    if (!pass.cliente.has(e.cliente))                            return false;
    if (!pass.tipo.has(e.cliente_tipo))                          return false;
    if (!e.produtos.some(p => pass.produto.has(p.nome)))         return false;
    return true;
  });

  renderTabela(filtradas);
}

function renderTabela(encomendas) {
  const tbody = document.getElementById('tabela-body');
  const empty = document.getElementById('empty-state');
  const contador = document.getElementById('contador');
  const total = todasEncomendas.length;
  const vis = encomendas.length;
  contador.textContent = (vis < total && total > 0)
    ? `${vis} de ${total} encomenda${total !== 1 ? 's' : ''}`
    : `${total} encomenda${total !== 1 ? 's' : ''}`;
  empty.style.display = vis === 0 ? 'block' : 'none';
  tbody.innerHTML = '';
  [...encomendas].reverse().forEach(e => {
    const produtosHTML = e.produtos.map(p => {
      const nota = p.notas ? `<div class="produto-tag-nota">↳ ${p.notas}</div>` : '';
      return `<div class="produto-tag"><strong>${p.nome}</strong> × ${p.quantidade}</div>${nota}`;
    }).join('');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-family:'DM Mono',monospace;color:var(--muted);font-size:12px;">${String(e.id).padStart(4,'0')}</td>
      <td style="font-family:'DM Mono',monospace;font-size:12px;white-space:nowrap;">${e.data}<br><span style="color:var(--muted);font-size:11px">${e.hora}</span></td>
      <td style="font-weight:500;">${e.cliente}</td>
      <td><span class="badge-tipo badge-${e.cliente_tipo}">${e.cliente_tipo}</span></td>
      <td><div class="produtos-cell">${produtosHTML}</div></td>
      <td>
        <div style="display:flex;flex-direction:column;gap:5px;">
          <button class="btn-download" onclick="downloadDoc(${e.id},'maquinacao')" title="Maquinação">⬇ Maquinação</button>
          <button class="btn-download" onclick="downloadDoc(${e.id},'etiquetas')" title="Etiquetas">⬇ Etiquetas</button>
          <button class="btn-download" onclick="downloadDoc(${e.id},'acabamento')" title="Acabamento">⬇ Acabamento</button>
        </div>
      </td>
      <td>
        <div style="display:flex;flex-direction:column;gap:5px;">
          <button class="btn-acao btn-edit" onclick='abrirModalEditar(${JSON.stringify(e).replace(/'/g, "\\'")})'>✏️ Editar</button>
          <button class="btn-acao btn-delete" onclick="confirmarApagar(${e.id}, '${(e.cliente || '').replace(/'/g, "\\'")}')">🗑️ Apagar</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function carregarHistorico() {
  const res = await fetch('/api/encomendas');
  todasEncomendas = await res.json();
  CAMPOS.forEach(c => msInicializar(c));
  GB_CAMPOS.forEach(k => gbInicializar(k));
  aplicarFiltros();
  if (graficoVisivel) { renderG1(); renderG2(); renderG3(); renderG4(); }
}

async function downloadDoc(id, tipo) { window.open(`/api/encomendas/${id}/download/${tipo}`, '_blank'); }
function exportarExcel() { window.open('/api/exportar-excel', '_blank'); }

// ── EDITAR / APAGAR ENCOMENDA ─────────────────────────
let meEncomendaId = null;
let meTipoSelecionado = 'AM';

function abrirModalEditar(enc) {
  meEncomendaId = enc.id;
  document.getElementById('me-id').textContent = `#${String(enc.id).padStart(4,'0')}`;
  document.getElementById('me-cliente').value = enc.cliente || '';
  meSelecionarTipo(enc.cliente_tipo || 'AM');

  // Reconstruir lista de produtos
  document.getElementById('me-produtos').innerHTML = '';
  (enc.produtos || []).forEach(p => meAdicionarProduto(p));
  if (!enc.produtos || !enc.produtos.length) meAdicionarProduto();

  document.getElementById('modal-editar').classList.add('open');
}

function fecharModalEditar() {
  document.getElementById('modal-editar').classList.remove('open');
  meEncomendaId = null;
}

function meSelecionarTipo(tipo) {
  meTipoSelecionado = tipo;
  document.querySelectorAll('#modal-editar .modal-tipo-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tipo === tipo);
  });
}

function meAdicionarProduto(p) {
  const wrapper = document.getElementById('me-produtos');
  const row = document.createElement('div');
  row.className = 'modal-produto-row';
  row.innerHTML = `
    <input type="text" placeholder="Nome do produto" class="me-prod-nome" value="${(p?.nome || '').replace(/"/g, '&quot;')}" />
    <input type="number" placeholder="Qt" min="1" class="me-prod-qt" value="${p?.quantidade || 1}" />
    <input type="text" placeholder="Notas (opcional)" class="me-prod-notas" value="${(p?.notas || '').replace(/"/g, '&quot;')}" />
    <button class="btn-remove" onclick="this.parentElement.remove()" title="Remover">✕</button>
  `;
  wrapper.appendChild(row);
}

async function guardarEdicao() {
  if (meEncomendaId === null) return;

  const cliente = document.getElementById('me-cliente').value.trim();
  if (!cliente) return toast('Preenche o nome do cliente.', true);

  const rows = document.querySelectorAll('#me-produtos .modal-produto-row');
  const produtos = [];
  for (const r of rows) {
    const nome = r.querySelector('.me-prod-nome').value.trim();
    const qt = parseInt(r.querySelector('.me-prod-qt').value, 10);
    const notas = r.querySelector('.me-prod-notas').value.trim();
    if (!nome) return toast('Preenche o nome de todos os produtos.', true);
    if (!qt || qt < 1) return toast('A quantidade deve ser pelo menos 1.', true);
    produtos.push({ nome, quantidade: qt, notas });
  }
  if (!produtos.length) return toast('A encomenda precisa de pelo menos um produto.', true);

  const btn = document.getElementById('me-btn-save');
  btn.disabled = true; btn.textContent = 'A guardar…';
  try {
    const res = await fetch(`/api/encomendas/${meEncomendaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cliente, cliente_tipo: meTipoSelecionado, produtos }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Erro desconhecido.');
    toast(data.mensagem || 'Encomenda atualizada!');
    fecharModalEditar();
    await carregarHistorico();
  } catch (err) {
    toast(err.message || 'Erro ao guardar.', true);
  } finally {
    btn.disabled = false; btn.textContent = 'Guardar Alterações';
  }
}

async function confirmarApagar(id, cliente) {
  const ok = confirm(`Apagar a encomenda #${String(id).padStart(4,'0')} do cliente "${cliente}"?\n\nEsta ação remove a encomenda do histórico e apaga os 3 documentos Word do disco. Não pode ser desfeita.`);
  if (!ok) return;

  try {
    const res = await fetch(`/api/encomendas/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Erro ao apagar.');
    toast(data.mensagem || 'Encomenda apagada!');
    await carregarHistorico();
  } catch (err) {
    toast(err.message || 'Erro ao apagar.', true);
  }
}

function toast(msg, erro = false) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = erro ? 'error show' : 'show';
  setTimeout(() => { t.className = erro ? 'error' : ''; }, 3000);
}

// ── GRÁFICOS ──────────────────────────────────────
let graficoVisivel = false;
function toggleGrafico() {
  graficoVisivel = !graficoVisivel;
  document.getElementById('graficos-panel').style.display = graficoVisivel ? 'block' : 'none';
  document.getElementById('btn-toggle-chart').classList.toggle('active', graficoVisivel);
  if (graficoVisivel) { renderG1(); renderG2(); renderG3(); renderG4(); }
}

// ── MULTISELECT DOS GRÁFICOS (reutiliza arquitectura msOpcoes) ──
const gbOpcoes = {}; // chave: 'g1-produto', 'g2-tipo', 'g2-cliente'
const GB_CAMPOS = ['g1-produto', 'g2-tipo', 'g2-cliente', 'g3-tipo', 'g3-cliente', 'g4-tipo', 'g4-cliente', 'g4-produto'];

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
    cb.addEventListener('change', () => {
      entry.checked = cb.checked;
      gbAtualizarLabel(key);
      gbRenderForKey(key);
    });
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
    d.classList.toggle('hidden', !d.querySelector('span').textContent.toLowerCase().includes(lq))
  );
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
  gbOpcoes[key]?.forEach(entry => entry.checked = true);
  document.querySelectorAll(`#glst-${key} .ms-opt input`).forEach(cb => cb.checked = true);
  gbAtualizarLabel(key);
  gbRenderForKey(key);
}

function gbLimpar(key) {
  gbOpcoes[key]?.forEach(entry => entry.checked = false);
  document.querySelectorAll(`#glst-${key} .ms-opt input`).forEach(cb => cb.checked = false);
  gbAtualizarLabel(key);
  gbRenderForKey(key);
}

function gbRenderForKey(key) {
  const n = key[1];
  if (n === '1') renderG1();
  else if (n === '2') renderG2();
  else if (n === '3') renderG3();
  else if (n === '4') renderG4();
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

// ── HELPERS GRÁFICOS ──
function parseDataPT(str) {
  const [d,m,y] = str.split('/').map(Number);
  return new Date(y, m-1, d);
}
function parseDataInput(str) {
  // yyyy-mm-dd
  if (!str) return null;
  const [y,m,d] = str.split('-').map(Number);
  return new Date(y, m-1, d);
}

function gbFiltrarEncomendas(deId, ateId, filtros) {
  const de  = parseDataInput(document.getElementById(deId).value);
  const ate = parseDataInput(document.getElementById(ateId).value);
  return todasEncomendas.filter(e => {
    const dt = parseDataPT(e.data);
    if (de  && dt < de)  return false;
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
  plugins: { legend: { labels: { color: '#f0ece0', font: { family: 'Inter', size: 11 }, boxWidth: 14 } }, tooltip: { backgroundColor: '#1a1916', borderColor: '#2e2c25', borderWidth: 1, titleColor: '#e8b84b', bodyColor: '#f0ece0', titleFont: { family: 'DM Mono', size: 11 }, bodyFont: { family: 'Inter', size: 12 }, padding: 12 } },
};

let chart1 = null;
function renderG1() {
  const enc = gbFiltrarEncomendas('g1-de', 'g1-ate', { 'g1-produto': 'produto' });
  const wrap = document.getElementById('grafico1').parentElement;
  const empty = document.getElementById('gempty1');
  if (!enc.length) { wrap.style.display='none'; empty.style.display='block'; if(chart1){chart1.destroy();chart1=null;} return; }
  wrap.style.display='block'; empty.style.display='none';
  // contar por tipo
  const contagem = {};
  enc.forEach(e => { contagem[e.cliente_tipo] = (contagem[e.cliente_tipo]||0) + 1; });
  const labels = Object.keys(contagem);
  const data   = labels.map(l => contagem[l]);
  const cores  = labels.map(l => l === 'AM' ? 'rgba(232,184,75,0.85)' : 'rgba(76,175,131,0.85)');
  const coresBorder = labels.map(l => l === 'AM' ? '#e8b84b' : '#4caf83');
  if (chart1) chart1.destroy();
  chart1 = new Chart(document.getElementById('grafico1').getContext('2d'), {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: cores, borderColor: coresBorder, borderWidth: 2, hoverOffset: 6 }] },
    options: { ...CHART_OPTS_BASE, cutout: '60%',
      plugins: { ...CHART_OPTS_BASE.plugins,
        tooltip: { ...CHART_OPTS_BASE.plugins.tooltip,
          callbacks: { label: i => `  ${i.label}: ${i.raw} encomenda${i.raw!==1?'s':''}` }
        }
      }
    }
  });
}

let chart2 = null;
function renderG2() {
  const enc = gbFiltrarEncomendas('g2-de', 'g2-ate', { 'g2-tipo': 'tipo', 'g2-cliente': 'cliente' });
  const wrap = document.getElementById('grafico2').parentElement;
  const empty = document.getElementById('gempty2');
  if (!enc.length) { wrap.style.display='none'; empty.style.display='block'; if(chart2){chart2.destroy();chart2=null;} return; }
  // somar quantidades por produto
  const soma = {};
  enc.forEach(e => e.produtos.forEach(p => { soma[p.nome] = (soma[p.nome]||0) + p.quantidade; }));
  const sorted = Object.entries(soma).sort((a,b) => b[1]-a[1]).slice(0,3);
  if (!sorted.length) { wrap.style.display='none'; empty.style.display='block'; return; }
  wrap.style.display='block'; empty.style.display='none';
  const labels = sorted.map(s => s[0]);
  const data   = sorted.map(s => s[1]);
  const CORES  = ['rgba(232,184,75,0.85)', 'rgba(91,156,246,0.85)', 'rgba(76,175,131,0.85)'];
  const BORDER = ['#e8b84b', '#5b9cf6', '#4caf83'];
  if (chart2) chart2.destroy();
  chart2 = new Chart(document.getElementById('grafico2').getContext('2d'), {
    type: 'bar',
    data: { labels, datasets: [{ data, backgroundColor: CORES.slice(0,labels.length), borderColor: BORDER.slice(0,labels.length), borderWidth: 2, borderRadius: 6 }] },
    options: { ...CHART_OPTS_BASE, indexAxis: 'y',
      plugins: { ...CHART_OPTS_BASE.plugins, legend: { display: false },
        tooltip: { ...CHART_OPTS_BASE.plugins.tooltip,
          callbacks: { label: i => `  ${i.raw} unidade${i.raw!==1?'s':''}` }
        }
      },
      scales: {
        x: { grid: { color: '#2e2c25' }, ticks: { color: '#7a776a', font: { family: 'DM Mono', size: 10 }, stepSize: 1, precision: 0 }, border: { color: '#2e2c25' }, beginAtZero: true },
        y: { grid: { color: 'transparent' }, ticks: { color: '#f0ece0', font: { family: 'Inter', size: 12 } }, border: { color: '#2e2c25' } }
      }
    }
  });
}


let chart3 = null;
function renderG3() {
  const enc = gbFiltrarEncomendas('g3-de', 'g3-ate', { 'g3-tipo': 'tipo', 'g3-cliente': 'cliente' });
  const wrap = document.getElementById('grafico3').parentElement;
  const empty = document.getElementById('gempty3');
  if (!enc.length) { wrap.style.display='none'; empty.style.display='block'; if(chart3){chart3.destroy();chart3=null;} return; }
  // agrupar por mês (yyyy-mm)
  const meses = {};
  enc.forEach(e => {
    const [d,m,y] = e.data.split('/');
    const mes = `${y}-${m}`;
    meses[mes] = (meses[mes]||0) + 1;
  });
  const labels = Object.keys(meses).sort();
  const labelsFormatados = labels.map(l => { const [y,m] = l.split('-'); return `${m}/${y}`; });
  const data = labels.map(l => meses[l]);
  wrap.style.display='block'; empty.style.display='none';
  if (chart3) chart3.destroy();
  chart3 = new Chart(document.getElementById('grafico3').getContext('2d'), {
    type: 'line',
    data: { labels: labelsFormatados, datasets: [{ label: 'Encomendas', data, borderColor: '#5b9cf6', backgroundColor: 'rgba(91,156,246,0.08)', borderWidth: 2.5, pointBackgroundColor: '#5b9cf6', pointRadius: 4, pointHoverRadius: 6, tension: 0.35, fill: true }] },
    options: { ...CHART_OPTS_BASE,
      plugins: { ...CHART_OPTS_BASE.plugins, legend: { display: false },
        tooltip: { ...CHART_OPTS_BASE.plugins.tooltip,
          callbacks: { label: i => `  ${i.raw} encomenda${i.raw!==1?'s':''}` }
        }
      },
      scales: {
        x: { grid: { color: '#2e2c25' }, ticks: { color: '#7a776a', font: { family: 'DM Mono', size: 10 } }, border: { color: '#2e2c25' } },
        y: { grid: { color: '#2e2c25' }, ticks: { color: '#7a776a', font: { family: 'DM Mono', size: 10 }, stepSize: 1, precision: 0 }, border: { color: '#2e2c25' }, beginAtZero: true }
      }
    }
  });
}

let chart4 = null;
function renderG4() {
  const enc = gbFiltrarEncomendas('g4-de', 'g4-ate', { 'g4-tipo': 'tipo', 'g4-cliente': 'cliente', 'g4-produto': 'produto' });
  const wrap = document.getElementById('grafico4').parentElement;
  const empty = document.getElementById('gempty4');
  if (!enc.length) { wrap.style.display='none'; empty.style.display='block'; if(chart4){chart4.destroy();chart4=null;} return; }
  // agrupar por mês, somar quantidades
  const meses = {};
  enc.forEach(e => {
    const [d,m,y] = e.data.split('/');
    const mes = `${y}-${m}`;
    const passaProduto = gbOpcoes['g4-produto']
      ? new Set(gbOpcoes['g4-produto'].filter(o => o.checked).map(o => o.val))
      : null;
    e.produtos.forEach(p => {
      if (passaProduto && !passaProduto.has(p.nome)) return;
      meses[mes] = (meses[mes]||0) + p.quantidade;
    });
  });
  const labels = Object.keys(meses).sort();
  if (!labels.length) { wrap.style.display='none'; empty.style.display='block'; return; }
  const labelsFormatados = labels.map(l => { const [y,m] = l.split('-'); return `${m}/${y}`; });
  const data = labels.map(l => meses[l]);
  wrap.style.display='block'; empty.style.display='none';
  if (chart4) chart4.destroy();
  chart4 = new Chart(document.getElementById('grafico4').getContext('2d'), {
    type: 'line',
    data: { labels: labelsFormatados, datasets: [{ label: 'Unidades', data, borderColor: '#e8b84b', backgroundColor: 'rgba(232,184,75,0.08)', borderWidth: 2.5, pointBackgroundColor: '#e8b84b', pointRadius: 4, pointHoverRadius: 6, tension: 0.35, fill: true }] },
    options: { ...CHART_OPTS_BASE,
      plugins: { ...CHART_OPTS_BASE.plugins, legend: { display: false },
        tooltip: { ...CHART_OPTS_BASE.plugins.tooltip,
          callbacks: { label: i => `  ${i.raw} unidade${i.raw!==1?'s':''}` }
        }
      },
      scales: {
        x: { grid: { color: '#2e2c25' }, ticks: { color: '#7a776a', font: { family: 'DM Mono', size: 10 } }, border: { color: '#2e2c25' } },
        y: { grid: { color: '#2e2c25' }, ticks: { color: '#7a776a', font: { family: 'DM Mono', size: 10 }, stepSize: 1, precision: 0 }, border: { color: '#2e2c25' }, beginAtZero: true }
      }
    }
  });
}

// ── INIT ───────────────────────────────────────────
adicionarProduto();
carregarHistorico();