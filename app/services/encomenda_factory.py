"""Factory para construir o dicionário de uma nova encomenda.

Separa a lógica de "como é uma encomenda" da lógica de persistência.
"""

from datetime import datetime
from typing import List

from app.models import ProdutoItem


def construir_nova_encomenda(
    novo_id: int,
    cliente: str,
    cliente_tipo: str,
    produtos: List[ProdutoItem],
) -> dict:
    """Constrói o dicionário de uma encomenda nova com data/hora atuais."""
    return {
        "id": novo_id,
        "data": datetime.now().strftime("%d/%m/%Y"),
        "hora": datetime.now().strftime("%H:%M"),
        "cliente": cliente,
        "cliente_tipo": cliente_tipo,
        "produtos": [
            {"nome": p.nome, "quantidade": p.quantidade, "notas": p.notas}
            for p in produtos
        ],
        "doc_maquinacao": "",
        "doc_etiquetas": "",
        "doc_acabamento": "",
    }