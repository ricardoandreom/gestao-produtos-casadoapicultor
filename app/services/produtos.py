"""Serviço de gestão do mapping de produtos (products_mapping.xlsx).

Usa-se a `ref_interna` como identificador único de cada produto.
"""

import pandas as pd

from app import config


COLUNAS = ["nome_produto", "ref_interna", "categoria_produto",
           "qt_palete_AM_FR", "notas"]


def _carregar_df() -> pd.DataFrame:
    """Carrega o ficheiro como DataFrame, criando estrutura vazia se não existir."""
    if not config.PRODUCTS_FILE.exists():
        return pd.DataFrame(columns=COLUNAS)

    df = pd.read_excel(str(config.PRODUCTS_FILE), dtype=str).fillna("")
    df.columns = [c.strip() for c in df.columns]

    # Renomear quaisquer variações da coluna "Notas " (com espaço) para "notas"
    rename_map = {}
    for c in df.columns:
        if c.strip().lower() == "notas" and c != "notas":
            rename_map[c] = "notas"
    if rename_map:
        df = df.rename(columns=rename_map)

    # Garantir que tem todas as colunas esperadas (preenche com "" se faltar)
    for col in COLUNAS:
        if col not in df.columns:
            df[col] = ""

    return df[COLUNAS]


def _gravar_df(df: pd.DataFrame) -> None:
    """Grava o DataFrame no ficheiro de mapping."""
    df.to_excel(str(config.PRODUCTS_FILE), index=False)


def listar() -> list:
    """Devolve todos os produtos do mapping como lista de dicts."""
    if not config.PRODUCTS_FILE.exists():
        return []
    return _carregar_df().to_dict(orient="records")


def adicionar(novo: dict) -> None:
    """Adiciona um produto ao mapping."""
    df = _carregar_df()

    nova_linha = {
        "nome_produto":      novo["nome_produto"],
        "ref_interna":       novo["ref_interna"],
        "categoria_produto": novo["categoria_produto"],
        "qt_palete_AM_FR":   novo["qt_palete_AM_FR"],
        "notas":             novo.get("notas", ""),
    }

    df = pd.concat([df, pd.DataFrame([nova_linha])], ignore_index=True)
    _gravar_df(df)


def editar(ref_interna: str, dados: dict) -> bool:
    """Edita um produto identificado pela ref_interna ORIGINAL.

    Permite alterar todos os campos, incluindo a própria ref_interna
    (caso o utilizador queira renomeá-la).

    Devolve True se editou, False se não encontrou.
    """
    df = _carregar_df()
    mask = df["ref_interna"].str.strip() == ref_interna.strip()

    if not mask.any():
        return False

    # Atualizar a primeira linha que corresponde
    idx = df.index[mask][0]
    df.at[idx, "nome_produto"]      = dados["nome_produto"]
    df.at[idx, "ref_interna"]       = dados["ref_interna"]
    df.at[idx, "categoria_produto"] = dados["categoria_produto"]
    df.at[idx, "qt_palete_AM_FR"]   = dados["qt_palete_AM_FR"]
    df.at[idx, "notas"]             = dados.get("notas", "")

    _gravar_df(df)
    return True


def apagar(ref_interna: str) -> bool:
    """Apaga um produto pela ref_interna.

    Devolve True se apagou, False se não encontrou.
    """
    df = _carregar_df()
    mask = df["ref_interna"].str.strip() == ref_interna.strip()

    if not mask.any():
        return False

    df = df[~mask].reset_index(drop=True)
    _gravar_df(df)
    return True