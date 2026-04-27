"""Geradores de documentos Word para encomendas.

Cada tipo de documento tem o seu próprio módulo:
    - generators.maquinacao   → Ordem de Fabrico
    - generators.etiquetas    → Etiquetas (linha por produto)
    - generators.acabamento   → Documento de Acabamento

Mantemos também os nomes originais (gerar_documento_word, gerar_etiquetas,
gerar_acabamento) como aliases para que o código antigo continue a funcionar:

    from generators import gerar_documento_word, gerar_etiquetas, gerar_acabamento
"""

from .maquinacao import gerar as gerar_documento_word
from .etiquetas import gerar as gerar_etiquetas
from .acabamento import gerar as gerar_acabamento

__all__ = [
    "gerar_documento_word",
    "gerar_etiquetas",
    "gerar_acabamento",
]