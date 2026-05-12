"""Gerador do documento de ACABAMENTO (Montagem e Acabamento).

Estratégia idêntica à da maquinação: abre acabamento_temp.docx como base,
que já tem o cabeçalho com o logo e as 3 linhas de datas no body.

Conteúdo por encomenda:
  Título:  FAZER - {total paletes} PALETES - {tipo}

  Por produto:
    {n paletes} - PALETES - CADA COM {qt_palete}
    - REF: {ref_interna}
    - {nome_produto}
    - {notas}          (se existirem)
    - TOTAL {quantidade}
"""

import math
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH

from ._common import (
    set_font, carregar_mapping_acabamento, qt_palete,
    _body_para, _update_header_order_num,
    _make_date_table_inline, _clear_body_paragraphs,
)


TEMPLATE_PATH = Path(__file__).parent.parent / "data" / "doc_templates" / "acabamento_temp.docx"


# ---------------------------------------------------------------------------
# Lógica específica do acabamento
# ---------------------------------------------------------------------------

def _calcular_n_paletes(quantidade: int, qt_str: str, cliente_tipo: str):
    """Devolve (n_paletes int, qt_val_str str) ou (None, qt_str) se não calculável."""
    qt_val_str = qt_palete(qt_str, cliente_tipo)
    try:
        qt_val = int(qt_val_str)
        if qt_val <= 0:
            return None, qt_val_str
        return math.ceil(quantidade / qt_val), qt_val_str
    except (ValueError, TypeError):
        return None, qt_val_str or qt_str


def _add_body(doc, encomenda, mapping):
    tipo     = encomenda["cliente_tipo"]
    produtos = encomenda["produtos"]

    items = []
    for produto in produtos:
        nome_up = produto["nome"].strip().upper()
        info    = mapping.get(nome_up, {})
        qt_str  = info.get("qt_palete_AM_FR", "")
        n_paletes, qt_val_str = _calcular_n_paletes(
            int(produto["quantidade"]), qt_str, tipo
        )
        items.append({
            "produto":    produto,
            "info":       info,
            "n_paletes":  n_paletes,
            "qt_val_str": qt_val_str,
        })

    total_paletes = sum(i["n_paletes"] for i in items if i["n_paletes"] is not None)

    _body_para(doc, "")

    _body_para(
        doc,
        f"FAZER - {total_paletes} PALETES - {tipo}",
        bold=True, underline=True, size_pt=38,
        align=WD_ALIGN_PARAGRAPH.LEFT,
    )

    for i, item in enumerate(items):
        if i > 0:
            _body_para(doc, "", space_after_pt=6)

        produto    = item["produto"]
        info       = item["info"]
        n_paletes  = item["n_paletes"]
        qt_display = item["qt_val_str"] or "?"
        n_str      = str(n_paletes) if n_paletes is not None else "?"

        _body_para(doc, f"{n_str} - PALETES - CADA COM {qt_display}",
                   bold=True, size_pt=26, space_after_pt=0)

        ref = info.get("ref_interna", "").strip()
        _body_para(doc, f"- REF: {ref}" if ref else "- REF: —",
                   size_pt=26, space_after_pt=0)

        nome_map = info.get("nome_produto", "").strip() or produto["nome"]
        _body_para(doc, f"- {nome_map}", size_pt=26, space_after_pt=0)

        notas = produto.get("notas", "").strip() or info.get("notas", "").strip()
        if notas:
            _body_para(doc, f"- {notas}", size_pt=26, space_after_pt=0)

        _body_para(doc, f"- TOTAL {produto['quantidade']}", size_pt=26, space_after_pt=6)


# ---------------------------------------------------------------------------
# Ponto de entrada
# ---------------------------------------------------------------------------

def gerar(encomenda: dict, caminho_saida: str):
    """Gera o documento de acabamento para a encomenda."""
    mapping = carregar_mapping_acabamento()

    doc = Document(str(TEMPLATE_PATH))

    _update_header_order_num(doc, encomenda)
    _make_date_table_inline(doc)
    _clear_body_paragraphs(doc)
    _add_body(doc, encomenda, mapping)

    doc.save(caminho_saida)
