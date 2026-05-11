'use strict';

let meEncomendaId = null;
let meTipoSelecionado = 'AM';

function abrirModalEditar(enc) {
  meEncomendaId = enc.id;
  document.getElementById('me-id').textContent = `#${String(enc.id).padStart(4,'0')}`;
  document.getElementById('me-cliente').value = enc.cliente || '';
  meSelecionarTipo(enc.cliente_tipo || 'AM');

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
    mostrarAvisosMapping(data.avisos || []);
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
