"""
Helpers partilhados pelos geradores de documentos Word.

Aqui ficam todas as funções utilitárias que mais do que um gerador usa:
- formatação de fontes/parágrafos
- linha horizontal
- carregamento do mapping de produtos (products_mapping.xlsx)
- extração da quantidade por palete consoante o tipo de cliente (AM/FR/OUTRO)
"""

from pathlib import Path

from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement


# --- Formatação de texto ---

def set_font(run, font_name="Arial Black", size_pt=22, bold=False, color=None):
    """Aplica fonte/tamanho/cor a um run e força a fonte também ao nível do XML
    (necessário em alguns Words que ignoram a propriedade Python)."""
    run.font.name = font_name
    run.font.size = Pt(size_pt)
    run.bold = bold
    if color:
        run.font.color.rgb = RGBColor(*color)

    r = run._r
    rPr = r.get_or_add_rPr()
    rFonts = OxmlElement('w:rFonts')
    rFonts.set(qn('w:ascii'), font_name)
    rFonts.set(qn('w:hAnsi'), font_name)
    rPr.insert(0, rFonts)


def add_paragraph(doc, text, align=WD_ALIGN_PARAGRAPH.LEFT,
                  font_name="Arial Black", size_pt=22, bold=False,
                  space_before=0, space_after=200, color=None):
    """Adiciona um parágrafo formatado ao documento e devolve-o."""
    p = doc.add_paragraph()
    p.alignment = align
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    run = p.add_run(text)
    set_font(run, font_name=font_name, size_pt=size_pt, bold=bold, color=color)
    return p


def add_horizontal_line(doc):
    """Insere uma linha horizontal cinzenta no documento."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(4)
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'), 'single')
    bottom.set(qn('w:sz'), '6')
    bottom.set(qn('w:space'), '1')
    bottom.set(qn('w:color'), 'CCCCCC')
    pBdr.append(bottom)
    pPr.append(pBdr)


# --- Mapping de produtos ---

def carregar_mapping():
    """Carrega o products_mapping.xlsx e devolve um dict
    {nome_produto_em_uppercase: qt_palete_AM_FR}."""
    import pandas as pd

    # data/ está dois níveis acima deste ficheiro: generators/ -> raiz -> data/
    mapping_path = Path(__file__).parent.parent / "data" / "products_mapping.xlsx"
    if not mapping_path.exists():
        return {}

    df = pd.read_excel(str(mapping_path), dtype=str).fillna("")
    df.columns = [c.strip() for c in df.columns]

    mapping = {}
    for _, row in df.iterrows():
        nome = str(row.get("nome_produto", "")).strip().upper()
        qt   = str(row.get("qt_palete_AM_FR", "")).strip()
        if nome:
            mapping[nome] = qt
    return mapping


def carregar_mapping_completo():
    """Carrega o products_mapping.xlsx e devolve um dict
    {nome_produto_em_uppercase: {"categoria": str, "notas": str}}."""
    import pandas as pd

    mapping_path = Path(__file__).parent.parent / "data" / "products_mapping.xlsx"
    if not mapping_path.exists():
        return {}

    df = pd.read_excel(str(mapping_path), dtype=str).fillna("")
    df.columns = [c.strip() for c in df.columns]

    mapping = {}
    for _, row in df.iterrows():
        nome = str(row.get("nome_produto", "")).strip().upper()
        if nome:
            mapping[nome] = {
                "categoria": str(row.get("categoria_produto", "")).strip().upper(),
                "notas":     str(row.get("notas", "")).strip(),
            }
    return mapping


def carregar_mapping_acabamento():
    """Carrega o products_mapping.xlsx e devolve um dict
    {nome_produto_em_uppercase: {ref_interna, qt_palete_AM_FR, notas, nome_produto}}."""
    import pandas as pd

    mapping_path = Path(__file__).parent.parent / "data" / "products_mapping.xlsx"
    if not mapping_path.exists():
        return {}

    df = pd.read_excel(str(mapping_path), dtype=str).fillna("")
    df.columns = [c.strip() for c in df.columns]

    mapping = {}
    for _, row in df.iterrows():
        nome = str(row.get("nome_produto", "")).strip().upper()
        if nome:
            mapping[nome] = {
                "nome_produto":   str(row.get("nome_produto", "")).strip(),
                "ref_interna":    str(row.get("ref_interna", "")).strip(),
                "qt_palete_AM_FR": str(row.get("qt_palete_AM_FR", "")).strip(),
                "notas":          str(row.get("notas", "")).strip(),
            }
    return mapping


def qt_palete(qt_str: str, cliente_tipo: str) -> str:
    """Da string '20/30' (AM/FR), devolve a parte que corresponde ao cliente_tipo.

    - AM e OUTRO → parte ANTES da "/"
    - FR         → parte DEPOIS da "/"
    """
    if not qt_str:
        return ""
    partes = qt_str.split("/")
    if cliente_tipo == "FR":
        return partes[1].strip() if len(partes) > 1 else partes[0].strip()
    # AM, OUTRO, ou qualquer outro valor desconhecido → parte AM
    return partes[0].strip()