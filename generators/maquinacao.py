"""Gerador do documento de MAQUINAÇÃO (Ordem de Fabrico).

Documento detalhado com cabeçalho, dados da encomenda e lista de produtos
com quantidade e notas opcionais."""

from docx import Document
from docx.shared import Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH

from ._common import set_font, add_paragraph, add_horizontal_line


def gerar(encomenda: dict, caminho_saida: str):
    """Gera o documento de maquinação para a encomenda."""
    doc = Document()

    # Margens
    section = doc.sections[0]
    section.top_margin = Pt(60)
    section.bottom_margin = Pt(60)
    section.left_margin = Pt(72)
    section.right_margin = Pt(72)

    # Título
    add_paragraph(
        doc,
        "ORDEM DE FABRICO",
        align=WD_ALIGN_PARAGRAPH.CENTER,
        font_name="Arial Black",
        size_pt=26,
        bold=True,
        space_before=0,
        space_after=6,
        color=(30, 30, 30),
    )

    add_horizontal_line(doc)
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # Cabeçalho da encomenda
    add_paragraph(doc, f"Encomenda Nº {encomenda['id']:04d}",
                  font_name="Arial Black", size_pt=22, space_after=6)
    add_paragraph(doc, f"Data: {encomenda['data']}",
                  font_name="Arial Black", size_pt=22, space_after=6)
    add_paragraph(doc, f"Cliente: {encomenda['cliente']}",
                  font_name="Arial Black", size_pt=22, space_after=6)
    add_paragraph(doc, f"Tipo: {encomenda['cliente_tipo']}",
                  font_name="Arial Black", size_pt=22, space_after=16)

    add_horizontal_line(doc)
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # Lista de produtos
    add_paragraph(doc, "PRODUTOS A MANUFATURAR",
                  font_name="Arial Black", size_pt=22, bold=True, space_after=10)

    for produto in encomenda["produtos"]:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.left_indent = Pt(20)

        run_bullet = p.add_run("▸  ")
        set_font(run_bullet, font_name="Arial Black", size_pt=22)

        run_prod = p.add_run(f"{produto['nome']}")
        set_font(run_prod, font_name="Arial Black", size_pt=22)

        run_qty = p.add_run(f"   ×{produto['quantidade']}")
        set_font(run_qty, font_name="Arial Black", size_pt=22, bold=True)

        # Notas opcionais
        notas = produto.get("notas", "").strip()
        if notas:
            p_notas = doc.add_paragraph()
            p_notas.paragraph_format.space_before = Pt(0)
            p_notas.paragraph_format.space_after = Pt(8)
            p_notas.paragraph_format.left_indent = Pt(44)
            run_notas = p_notas.add_run(f"↳ {notas}")
            set_font(run_notas, font_name="Arial Black", size_pt=14,
                     color=(120, 116, 100))
        else:
            p.paragraph_format.space_after = Pt(8)

    add_horizontal_line(doc)

    # Total
    total = sum(p["quantidade"] for p in encomenda["produtos"])
    add_paragraph(doc, f"Total de unidades: {total}",
                  font_name="Arial Black", size_pt=22, bold=True,
                  space_before=10, space_after=0)

    doc.save(caminho_saida)