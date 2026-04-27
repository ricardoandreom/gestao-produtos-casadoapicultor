"""Configuração central do projeto.

Tudo o que são caminhos, constantes e definições partilhadas vive aqui.
Mudou um caminho? Muda-se num sítio só.
"""

from pathlib import Path
from typing import Union

# --- Diretórios base ---

# Raiz do projeto (sobe dois níveis: app/config.py -> app -> raiz)
BASE_DIR = Path(__file__).parent.parent

# Documentos gerados (Word)
DOCS_DIR             = BASE_DIR / "encomendas_docs"
DOCS_DIR_MAQUINACAO  = DOCS_DIR / "maquinacao"
DOCS_DIR_ETIQUETAS   = DOCS_DIR / "etiquetas"
DOCS_DIR_ACABAMENTO  = DOCS_DIR / "acabamentos"

# Ficheiros de dados
DATA_DIR        = BASE_DIR / "data"
DATA_FILE       = DATA_DIR / "historico.json"
PRODUCTS_FILE   = DATA_DIR / "products_mapping.xlsx"
EXCEL_EXPORT    = DATA_DIR / "historico_encomendas.xlsx"

# Frontend
STATIC_DIR      = BASE_DIR / "static"
TEMPLATES_DIR   = BASE_DIR / "templates"


# --- Constantes ---

# Tipos de cliente válidos
# - AM: usa a parte ANTES da "/" no qt_palete_AM_FR (ex: "20/30" → 20)
# - FR: usa a parte DEPOIS da "/" (ex: "20/30" → 30)
# - OUTRO: trata-se como AM (usa parte antes da "/")
CLIENTE_TIPOS = ("AM", "FR", "OUTRO")


# --- Helpers de caminhos ---

def to_relative(caminho: Union[str, Path]) -> str:
    """Converte um caminho absoluto para relativo à raiz do projeto.

    Usa-se ao GUARDAR caminhos no historico.json — assim os caminhos
    ficam portáteis (funcionam em qualquer máquina e qualquer pasta).

    Exemplo:
        C:\\Users\\Admin\\...\\encomendas_docs\\maquinacao\\maq_0001.docx
        → encomendas_docs/maquinacao/maq_0001.docx
    """
    p = Path(caminho)
    try:
        return p.relative_to(BASE_DIR).as_posix()
    except ValueError:
        # Caminho fora da raiz do projeto — devolve como está
        return str(p)


def to_absolute(caminho: Union[str, Path]) -> Path:
    """Converte um caminho (relativo ou absoluto) para Path absoluto.

    Usa-se ao LER caminhos do historico.json — junta a raiz do projeto
    se o caminho for relativo, ou devolve como está se já for absoluto
    (compatibilidade com encomendas antigas).
    """
    p = Path(caminho)
    if p.is_absolute():
        return p
    return BASE_DIR / p


# --- Setup ---

def garantir_pastas():
    """Cria todas as pastas necessárias se ainda não existirem."""
    for pasta in (DOCS_DIR, DOCS_DIR_MAQUINACAO, DOCS_DIR_ETIQUETAS,
                  DOCS_DIR_ACABAMENTO, DATA_DIR):
        pasta.mkdir(exist_ok=True, parents=True)

    # Garantir que o historico.json existe
    if not DATA_FILE.exists():
        DATA_FILE.write_text("[]", encoding="utf-8")