'use strict';

let todosProdutos = [];

// ── MULTISELECT ────────────────────────────────────
const CAMPOS = ['nome','ref','cat','qt','notas'];
const msOpcoes = { nome:[], ref:[], cat:[], qt:[], notas:[] };

function msGetValores(campo) {
  const s = new Set();
  todosProdutos.forEach(p => {
    if      (campo === 'nome')  s.add(p.nome_produto || '');
    else if (campo === 'ref')   s.add(p.ref_interna || '');
    else if (campo === 'cat')   s.add(p.categoria_produto || '');
    else if (campo === 'qt')    s.add(p.qt_palete_AM_FR || '');
    else if (campo === 'notas') s.add(p.notas || '');
  });
  return [...s].filter(v => v !== '').sort((a,b) => a.localeCompare(b, 'pt'));
}

function msInicializar(campo) {
  const valores = msGetValores(campo);
  const lst = document.getElementById('lst-' + campo);
  lst.innerHTML = '';
  msOpcoes[campo] = [];

  const temVazios = todosProdutos.some(p => {
    if (campo === 'nome')  return !p.nome_produto;
    if (campo === 'ref')   return !p.ref_interna;
    if (campo === 'cat')   return !p.categoria_produto;
    if (campo === 'qt')    return !p.qt_palete_AM_FR;
    if (campo === 'notas') return !p.notas;
  });

  const todasEntradas = temVazios ? ['(vazio)', ...valores] : valores;

  todasEntradas.forEach(val => {
    const entry = { val, checked: true };
    msOpcoes[campo].push(entry);
    const div = document.createElement('div');
    div.className = 'ms-opt';
    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.checked = true;
    cb.addEventListener('change', () => { entry.checked = cb.checked; msAtualizarLabel(campo); aplicarFiltros(); });
    const span = document.createElement('span');
    span.textContent = val; span.title = val;
    div.appendChild(cb); div.appendChild(span);
    lst.appendChild(div);
  });
  msAtualizarLabel(campo);
}

function msPesquisar(campo, q) {
  const lq = q.toLowerCase();
  document.querySelectorAll(`#lst-${campo} .ms-opt`).forEach(d =>
    d.classList.toggle('hidden', !d.querySelector('span').textContent.toLowerCase().includes(lq)));
}

function msAbrir(campo) {
  const isOpen = document.getElementById('pan-' + campo).classList.contains('open');
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

function msSelectAll(campo) {
  msOpcoes[campo].forEach(e => e.checked = true);
  document.querySelectorAll(`#lst-${campo} .ms-opt input`).forEach(cb => cb.checked = true);
  msAtualizarLabel(campo); aplicarFiltros();
}

function msLimpar(campo) {
  msOpcoes[campo].forEach(e => e.checked = false);
  document.querySelectorAll(`#lst-${campo} .ms-opt input`).forEach(cb => cb.checked = false);
  msAtualizarLabel(campo); aplicarFiltros();
}

function msLimparTudo() { CAMPOS.forEach(c => msLimpar(c)); }
function msSelecionarTudo() { CAMPOS.forEach(c => msSelectAll(c)); }

function msAtualizarLabel(campo) {
  const sel = msOpcoes[campo].filter(e => e.checked);
  const tot = msOpcoes[campo].length;
  const lbl = document.getElementById('tlbl-' + campo);
  const trig = document.getElementById('trig-' + campo);
  if (sel.length === 0) { lbl.textContent = '(nenhum)'; trig.classList.add('active'); }
  else if (sel.length === tot) { lbl.textContent = 'Todos'; trig.classList.remove('active'); }
  else if (sel.length === 1) { lbl.textContent = sel[0].val; trig.classList.add('active'); }
  else { lbl.textContent = `${sel.length} selecionados`; trig.classList.add('active'); }
}

// ── FILTROS + RENDER ───────────────────────────────
function getValCampo(p, campo) {
  if (campo === 'nome')  return p.nome_produto || '';
  if (campo === 'ref')   return p.ref_interna || '';
  if (campo === 'cat')   return p.categoria_produto || '';
  if (campo === 'qt')    return p.qt_palete_AM_FR || '';
  if (campo === 'notas') return p.notas || '';
  return '';
}

function aplicarFiltros() {
  const pass = {};
  CAMPOS.forEach(c => { pass[c] = new Set(msOpcoes[c].filter(e => e.checked).map(e => e.val)); });

  const filtrados = todosProdutos.filter(p =>
    CAMPOS.every(c => {
      const val = getValCampo(p, c) || '';
      return pass[c].has(val === '' ? '(vazio)' : val);
    })
  );

  renderTabela(filtrados);
}

function renderTabela(lista) {
  const tbody = document.getElementById('pm-tbody');
  const empty = document.getElementById('empty-state');
  const contador = document.getElementById('pm-contador');
  const total = todosProdutos.length;
  const vis = lista.length;
  contador.textContent = (vis < total && total > 0)
    ? `${vis} de ${total} produto${total !== 1 ? 's' : ''}`
    : `${total} produto${total !== 1 ? 's' : ''}`;
  empty.style.display = vis === 0 ? 'block' : 'none';
  tbody.innerHTML = '';
  lista.forEach(p => {
    const tr = document.createElement('tr');
    const dadosEscapados = JSON.stringify(p).replace(/'/g, "\\'");
    const refEscapada = (p.ref_interna || '').replace(/'/g, "\\'");
    tr.innerHTML = `
      <td style="max-width:300px;white-space:normal;line-height:1.4;">${p.nome_produto || '—'}</td>
      <td><span class="pm-ref">${p.ref_interna || '—'}</span></td>
      <td>${p.categoria_produto ? `<span class="pm-cat">${p.categoria_produto}</span>` : '—'}</td>
      <td><span class="pm-qt">${p.qt_palete_AM_FR || '—'}</span></td>
      <td><span class="pm-notas">${p.notas || ''}</span></td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn-acao btn-edit" onclick='abrirModalEditar(${dadosEscapados})'>✏️</button>
          <button class="btn-acao btn-delete" onclick="confirmarApagar('${refEscapada}')">🗑️</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ── API ────────────────────────────────────────────
async function carregarProdutos() {
  const res = await fetch('/api/produtos');
  todosProdutos = await res.json();
  CAMPOS.forEach(c => msInicializar(c));
  aplicarFiltros();
}

// ── MODAL ──────────────────────────────────────────
let refOriginal = null;

function abrirModal() {
  refOriginal = null;
  document.getElementById('modal-title-text').textContent = 'Novo Produto';
  ['mp-nome','mp-ref','mp-cat','mp-qt','mp-notas'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('modal-produto').classList.add('open');
  document.getElementById('mp-nome').focus();
}

function abrirModalEditar(p) {
  refOriginal = p.ref_interna;
  document.getElementById('modal-title-text').textContent = 'Editar Produto';
  document.getElementById('mp-nome').value  = p.nome_produto || '';
  document.getElementById('mp-ref').value   = p.ref_interna || '';
  document.getElementById('mp-cat').value   = p.categoria_produto || '';
  document.getElementById('mp-qt').value    = p.qt_palete_AM_FR || '';
  document.getElementById('mp-notas').value = p.notas || '';
  document.getElementById('modal-produto').classList.add('open');
  document.getElementById('mp-nome').focus();
}

function fecharModal() {
  document.getElementById('modal-produto').classList.remove('open');
  refOriginal = null;
}

async function guardarProduto() {
  const nome  = document.getElementById('mp-nome').value.trim();
  const ref   = document.getElementById('mp-ref').value.trim();
  const cat   = document.getElementById('mp-cat').value.trim();
  const qt    = document.getElementById('mp-qt').value.trim();
  const notas = document.getElementById('mp-notas').value.trim();

  if (!nome) { toast('Preenche o nome do produto.', true); return; }
  if (!ref)  { toast('Preenche a referência interna.', true); return; }

  const btn = document.getElementById('btn-save');
  btn.disabled = true; btn.textContent = 'A guardar…';

  const isEdit = refOriginal !== null;
  const url    = isEdit ? `/api/produtos/${encodeURIComponent(refOriginal)}` : '/api/produtos';
  const method = isEdit ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome_produto: nome, ref_interna: ref, categoria_produto: cat, qt_palete_AM_FR: qt, notas })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Erro desconhecido.');
    toast(data.mensagem || (isEdit ? 'Produto atualizado!' : 'Produto adicionado!'));
    fecharModal();
    await carregarProdutos();
  } catch (err) {
    toast(err.message || 'Erro ao guardar.', true);
  } finally {
    btn.disabled = false; btn.textContent = 'Guardar Produto';
  }
}

async function confirmarApagar(refInterna) {
  const ok = confirm(`Apagar o produto com referência "${refInterna}"?\n\nEsta ação não pode ser desfeita.`);
  if (!ok) return;
  try {
    const res = await fetch(`/api/produtos/${encodeURIComponent(refInterna)}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Erro ao apagar.');
    toast(data.mensagem || 'Produto apagado!');
    await carregarProdutos();
  } catch (err) {
    toast(err.message || 'Erro ao apagar.', true);
  }
}

carregarProdutos();
