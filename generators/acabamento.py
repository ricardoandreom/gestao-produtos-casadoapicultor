"""Gerador do documento de ACABAMENTO.

Por agora é uma cópia do documento de maquinação.
Quando tiveres um layout próprio para o acabamento, é aqui que se altera —
basta editar este ficheiro sem mexer em mais nada."""

from . import maquinacao


def gerar(encomenda: dict, caminho_saida: str):
    """Gera o documento de acabamento para a encomenda."""
    # Por enquanto delega para o gerador de maquinação.
    maquinacao.gerar(encomenda, caminho_saida)