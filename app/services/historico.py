"""Serviço de gestão do histórico de encomendas.

Esconde o detalhe de que o histórico vive num ficheiro JSON.
Se um dia migrarmos para SQLite, só este ficheiro muda — o resto da
aplicação continua a chamar `carregar()`, `guardar()`, `criar()`, etc.
"""

import json
from typing import Optional

from app import config
from app.services.encomenda_factory import construir_nova_encomenda
from app.services.documentos import gerar_documentos, apagar_documentos


# --- Leitura/escrita JSON ---

def carregar() -> list:
    """Carrega todas as encomendas do disco.

    Tenta primeiro UTF-8 (o que gravamos hoje em dia).
    Se falhar, faz fallback para Windows-1252 — útil para ler
    históricos antigos gravados pela versão original do código.
    """
    raw = config.DATA_FILE.read_bytes()
    try:
        return json.loads(raw.decode("utf-8"))
    except UnicodeDecodeError:
        return json.loads(raw.decode("cp1252"))


def guardar(historico: list) -> None:
    """Persiste o histórico no disco em UTF-8 e atualiza o Excel."""
    # Import aqui para evitar import circular
    from app.services.excel_export import exportar_excel

    config.DATA_FILE.write_text(
        json.dumps(historico, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    exportar_excel(historico)


# --- Operações ---

def proximo_id(historico: list) -> int:
    return max((e["id"] for e in historico), default=0) + 1


def encontrar(historico: list, encomenda_id: int) -> Optional[dict]:
    return next((e for e in historico if e["id"] == encomenda_id), None)


def criar(cliente: str, cliente_tipo: str, produtos: list) -> dict:
    """Cria uma encomenda nova: gera os 3 documentos Word e persiste."""
    historico = carregar()
    novo_id = proximo_id(historico)

    nova = construir_nova_encomenda(novo_id, cliente, cliente_tipo, produtos)
    gerar_documentos(nova)

    historico.append(nova)
    guardar(historico)
    return nova


def editar(encomenda_id: int, cliente: str, cliente_tipo: str, produtos: list) -> Optional[dict]:
    """Edita uma encomenda existente.

    - Atualiza cliente, tipo e produtos
    - Mantém id, data, hora originais
    - Apaga os 3 Word antigos e gera novos
    - Devolve a encomenda atualizada (ou None se não existir)
    """
    historico = carregar()
    enc = encontrar(historico, encomenda_id)
    if enc is None:
        return None

    # Apagar Word antigos
    apagar_documentos(enc)

    # Atualizar dados
    enc["cliente"] = cliente
    enc["cliente_tipo"] = cliente_tipo
    enc["produtos"] = [
        {"nome": p.nome, "quantidade": p.quantidade, "notas": p.notas}
        for p in produtos
    ]
    # Limpar caminhos antigos antes de regenerar
    enc["doc_maquinacao"] = ""
    enc["doc_etiquetas"] = ""
    enc["doc_acabamento"] = ""

    # Gerar Word novos (atualiza os campos doc_*)
    gerar_documentos(enc)

    guardar(historico)
    return enc


def apagar(encomenda_id: int) -> bool:
    """Apaga uma encomenda do histórico e os 3 Word do disco.

    Devolve True se apagou, False se não encontrou.
    """
    historico = carregar()
    enc = encontrar(historico, encomenda_id)
    if enc is None:
        return False

    apagar_documentos(enc)
    historico.remove(enc)
    guardar(historico)
    return True


def caminho_documento(encomenda: dict, tipo: str) -> Optional[str]:
    """Devolve o caminho ABSOLUTO do documento de um determinado tipo
    (maquinacao | etiquetas | acabamento), ou None se não existir.
    """
    campo = f"doc_{tipo}"
    caminho = encomenda.get(campo, "")

    # Compatibilidade com formato muito antigo (só doc_path)
    if not caminho and tipo == "maquinacao":
        caminho = encomenda.get("doc_path", "")

    if not caminho:
        return None

    caminho_abs = config.to_absolute(caminho)
    if caminho_abs.exists():
        return str(caminho_abs)
    return None