'use strict';

let todasEncomendas = [];

// ── MULTISELECT FILTROS ────────────────────────────
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

function msInicializar(campo) {
  const valores = msGetValores(campo);
  const lst = document.getElementById('lst-' + campo);
  lst.innerHTML = '';
  msOpcoes[campo] = [];

  valores.forEach(val => {
    const entry = { val, checked: true };
    msOpcoes[campo].push(entry);

    const div = document.createElement('div');
    div.className = 'ms-opt';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = true;
    cb.addEventListener('change', () => {
      entry.checked = cb.checked;
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
  msOpcoes[campo].forEach(entry => entry.checked = true);
  document.querySelectorAll(`#lst-${campo} .ms-opt input`).forEach(cb => cb.checked = true);
  msAtualizarLabel(campo);
  aplicarFiltros();
}

function msLimpar(campo) {
  msOpcoes[campo].forEach(entry => entry.checked = false);
  document.querySelectorAll(`#lst-${campo} .ms-opt input`).forEach(cb => cb.checked = false);
  msAtualizarLabel(campo);
  aplicarFiltros();
}

function msLimparTudo() { CAMPOS.forEach(c => msLimpar(c)); }
function msSelecionarTudo() { CAMPOS.forEach(c => msSelectAll(c)); }

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
  const pass = {};
  CAMPOS.forEach(c => {
    pass[c] = new Set(msOpcoes[c].filter(e => e.checked).map(e => e.val));
  });

  const filtradas = todasEncomendas.filter(e => {
    if (!pass.id.has(String(e.id).padStart(4,'0')))        return false;
    if (!pass.data.has(e.data))                             return false;
    if (!pass.cliente.has(e.cliente))                       return false;
    if (!pass.tipo.has(e.cliente_tipo))                     return false;
    if (!e.produtos.some(p => pass.produto.has(p.nome)))    return false;
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
