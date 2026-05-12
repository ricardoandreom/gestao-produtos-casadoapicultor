'use strict';

let tipoSelecionado = 'AM';

function selecionarTipo(tipo) {
  tipoSelecionado = tipo;
  document.querySelectorAll('.tipo-btn').forEach(b => b.classList.toggle('active', b.dataset.tipo === tipo));
}

async function carregarProdutosDatalist() {
  try {
    const res = await fetch('/api/produtos');
    const produtos = await res.json();
    const dl = document.getElementById('produtos-datalist');
    if (!dl) return;
    dl.innerHTML = '';
    produtos.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.nome_produto;
      dl.appendChild(opt);
    });
  } catch (_) {}
}

function adicionarProduto(nome = '', qty = '', notas = '') {
  const lista = document.getElementById('produtos-lista');
  const row = document.createElement('div');
  row.className = 'produto-row';
  row.innerHTML = `
    <div class="produto-wrap">
      <input type="text" placeholder="Nome do produto" value="${nome}" class="prod-nome" list="produtos-datalist"/>
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
    mostrarAvisosMapping(data.avisos || []);
    document.getElementById('cliente').value = '';
    document.getElementById('produtos-lista').innerHTML = '';
    adicionarProduto();
    await carregarHistorico();
  } catch (e) { toast(e.message, true); }
  finally { btn.disabled = false; btn.textContent = 'Gerar Encomenda'; }
}
