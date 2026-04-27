"""Orquestrador da geração dos 3 documentos Word de uma encomenda.

Fica claro num só sítio quais os 3 ficheiros que se geram, onde vão
parar e como se chamam.

Os caminhos guardados no dict da encomenda são RELATIVOS à raiz do
projeto (para portabilidade entre máquinas).
"""

from datetime import datetime

from app import config
from generators import gerar_documento_word, gerar_etiquetas, gerar_acabamento


def gerar_documentos(encomenda: dict) -> None:
    """Gera os 3 documentos Word e atualiza os caminhos no dict da encomenda."""
    data_fmt = datetime.now().strftime("%d%m%Y")
    eid = encomenda["id"]

    ficheiros = {
        "doc_maquinacao": (
            config.DOCS_DIR_MAQUINACAO / f"maquinacao_{eid:04d}_{data_fmt}.docx",
            gerar_documento_word,
        ),
        "doc_etiquetas": (
            config.DOCS_DIR_ETIQUETAS / f"etiquetas_{eid:04d}_{data_fmt}.docx",
            gerar_etiquetas,
        ),
        "doc_acabamento": (
            config.DOCS_DIR_ACABAMENTO / f"acabamento_{eid:04d}_{data_fmt}.docx",
            gerar_acabamento,
        ),
    }

    for campo, (caminho_abs, func) in ficheiros.items():
        # Gera o ficheiro com caminho absoluto (a python-docx precisa)
        func(encomenda, str(caminho_abs))
        # Mas guarda relativo no dict (para portabilidade)
        encomenda[campo] = config.to_relative(caminho_abs)


def apagar_documentos(encomenda: dict) -> None:
    """Apaga os 3 ficheiros Word de uma encomenda do disco.

    Se algum ficheiro não existir, ignora silenciosamente.
    Aceita encomendas no formato antigo (com `doc_path` em vez de
    `doc_maquinacao`).
    """
    campos = ("doc_maquinacao", "doc_etiquetas", "doc_acabamento", "doc_path")

    for campo in campos:
        caminho = encomenda.get(campo, "")
        if not caminho:
            continue
        caminho_abs = config.to_absolute(caminho)
        try:
            if caminho_abs.exists():
                caminho_abs.unlink()
        except OSError:
            # Ficheiro bloqueado ou outro problema — ignorar e continuar
            pass