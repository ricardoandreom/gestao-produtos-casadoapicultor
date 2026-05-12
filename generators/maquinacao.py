"""Gerador do documento de MAQUINAÇÃO (Ordem de Produção).

Estratégia: abre o template 'maq_temp.docx' como base, o que preserva
exactamente o cabeçalho de página (logo VML + tabela de datas flutuante)
e as definições da página (margens, estilos).

Em seguida:
  1. Substitui o número de ordem na célula (0,2) do header
  2. Remove apenas os parágrafos do body (a tabela de datas fica intacta)
  3. Reconstrói os parágrafos com os dados da encomenda
"""

from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH

from ._common import (
    set_font, carregar_mapping_completo,
    _body_para, _update_header_order_num,
    _make_date_table_inline, _clear_body_paragraphs,
)


TEMPLATE_PATH = Path(__file__).parent.parent / "data" / "doc_templates" / "maq_temp.docx"


# ---------------------------------------------------------------------------
# Lógica específica da maquinação
# ---------------------------------------------------------------------------

def _agrupar_por_categoria(produtos, mapping):
    """Agrupa produtos por categoria, preservando a ordem de entrada."""
    grupos: dict[str, list] = {}
    for produto in produtos:
        nome_up   = produto["nome"].strip().upper()
        info      = mapping.get(nome_up, {})
        categoria = info.get("categoria", "").strip() or "OUTROS"
        notas_map = info.get("notas", "").strip()
        grupos.setdefault(categoria, []).append((produto, notas_map))
    return grupos


def _add_body(doc, encomenda, mapping):
    """Reconstrói os parágrafos do body com os dados da encomenda."""
    grupos = _agrupar_por_categoria(encomenda["produtos"], mapping)

    _body_para(doc, "")

    _body_para(
        doc,
        f"FAZER – PRODUÇÃO {encomenda['cliente_tipo']}",
        bold=True, underline=True, size_pt=38,
        align=WD_ALIGN_PARAGRAPH.LEFT,
    )

    first = True
    for categoria, itens in grupos.items():
        if not first:
            _body_para(doc, "", space_after_pt=6)
        first = False

        _body_para(doc, categoria, bold=True, underline=True, size_pt=26)

        for produto, notas_map in itens:
            _body_para(
                doc,
                f"{produto['quantidade']} – {produto['nome']}",
                size_pt=26, space_after_pt=6,
            )
            notas = produto.get("notas", "").strip() or notas_map
            if notas:
                _body_para(doc, f"- {notas}", size_pt=26, space_after_pt=6)


# ---------------------------------------------------------------------------
# Ponto de entrada
# ---------------------------------------------------------------------------

def gerar(encomenda: dict, caminho_saida: str):
    """Gera o documento de maquinação para a encomenda."""
    mapping = carregar_mapping_completo()

    doc = Document(str(TEMPLATE_PATH))

    _update_header_order_num(doc, encomenda)
    _make_date_table_inline(doc)
    _clear_body_paragraphs(doc)
    _add_body(doc, encomenda, mapping)

    doc.save(caminho_saida)
