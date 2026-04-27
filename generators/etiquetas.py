"""Gerador do documento de ETIQUETAS.

Para cada produto da encomenda escreve uma linha:
    {quantidade_palete} - {nome_produto}

A quantidade_palete vem do mapping AM/FR (products_mapping.xlsx).
Se o produto não existir no mapping, escreve apenas o nome."""

from docx import Document
from docx.shared import Pt

from ._common import set_font, carregar_mapping, qt_palete


def gerar(encomenda: dict, caminho_saida: str):
    """Gera o documento de etiquetas para a encomenda."""
    mapping = carregar_mapping()
    cliente_tipo = encomenda.get("cliente_tipo", "AM")

    doc = Document()
    section = doc.sections[0]
    section.top_margin = Pt(50)
    section.bottom_margin = Pt(50)
    section.left_margin = Pt(72)
    section.right_margin = Pt(72)

    for produto in encomenda["produtos"]:
        nome_upper = produto["nome"].strip().upper()
        qt_str = mapping.get(nome_upper, "")
        qtd = qt_palete(qt_str, cliente_tipo)

        if qtd:
            linha = f"{qtd} - {produto['nome']}"
        else:
            # Produto sem mapping → escreve só o nome
            linha = produto["nome"]

        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(18)
        run = p.add_run(linha)
        set_font(run, font_name="Arial Black", size_pt=22, bold=True)

    doc.save(caminho_saida)