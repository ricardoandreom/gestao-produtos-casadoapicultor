'use strict';

function toast(msg, erro = false) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = erro ? 'error show' : 'show';
  setTimeout(() => { t.className = erro ? 'error' : ''; }, 3000);
}

function mostrarAvisosMapping(avisos) {
  const el = document.getElementById('avisos-mapping');
  if (!avisos || !avisos.length) { el.style.display = 'none'; return; }
  el.innerHTML =
    `<div class="avisos-mapping-header">⚠ Atenção — products_mapping.xlsx</div>` +
    `<ul class="avisos-mapping-lista">${avisos.map(a => `<li>${a}</li>`).join('')}</ul>` +
    `<div class="avisos-mapping-footer">Acede ao <a href="/mapeamento">Mapeamento</a> para corrigir.</div>` +
    `<button class="avisos-mapping-fechar" onclick="document.getElementById('avisos-mapping').style.display='none'">✕</button>`;
  el.style.display = 'block';
}
