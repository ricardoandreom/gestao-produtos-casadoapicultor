"""Modelos Pydantic para validação de pedidos da API.

Centralizamos aqui todos os modelos para que sejam fáceis de encontrar
e reutilizar entre rotas.
"""

from typing import List, Optional
from pydantic import BaseModel


# --- Encomendas ---

class ProdutoItem(BaseModel):
    nome: str
    quantidade: int
    notas: str = ""


class EncomendaRequest(BaseModel):
    cliente: str
    cliente_tipo: str  # "AM" ou "FR"
    produtos: List[ProdutoItem]


# --- Produtos (mapping) ---

class ProductMappingItem(BaseModel):
    nome_produto: str
    ref_interna: str
    categoria_produto: str
    qt_palete_AM_FR: str
    notas: Optional[str] = ""