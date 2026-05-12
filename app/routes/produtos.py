"""Rotas API do mapping de produtos."""

import re
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from app.models import ProductMappingItem
from app.services import produtos as produtos_service


router = APIRouter(prefix="/api/produtos", tags=["produtos"])

_QT_RE = re.compile(r'^\d+(/\d+)?$')


def _validar_qt_palete(qt: str):
    if qt and not _QT_RE.match(qt.strip()):
        raise HTTPException(
            status_code=422,
            detail="Qt. Palete AM/FR deve ter o formato NUM/NUM (ex: 20/30)."
        )


@router.get("")
async def listar_produtos():
    return JSONResponse(content=produtos_service.listar())


@router.post("")
async def adicionar_produto(produto: ProductMappingItem):
    _validar_qt_palete(produto.qt_palete_AM_FR)
    produtos_service.adicionar(produto.dict())
    return JSONResponse(content={
        "sucesso": True,
        "mensagem": "Produto adicionado com sucesso!",
    })


@router.put("/{ref_interna}")
async def editar_produto(ref_interna: str, produto: ProductMappingItem):
    """Edita o produto identificado pela ref_interna ORIGINAL.

    Permite alterar todos os campos (incluindo a própria ref_interna,
    se o utilizador quiser renomear).
    """
    _validar_qt_palete(produto.qt_palete_AM_FR)
    ok = produtos_service.editar(ref_interna, produto.dict())
    if not ok:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")

    return JSONResponse(content={
        "sucesso": True,
        "mensagem": "Produto atualizado com sucesso!",
    })


@router.delete("/{ref_interna}")
async def apagar_produto(ref_interna: str):
    ok = produtos_service.apagar(ref_interna)
    if not ok:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")

    return JSONResponse(content={
        "sucesso": True,
        "mensagem": "Produto apagado com sucesso!",
    })