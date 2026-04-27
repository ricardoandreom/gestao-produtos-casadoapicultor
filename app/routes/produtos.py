"""Rotas API do mapping de produtos."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from app.models import ProductMappingItem
from app.services import produtos as produtos_service


router = APIRouter(prefix="/api/produtos", tags=["produtos"])


@router.get("")
async def listar_produtos():
    return JSONResponse(content=produtos_service.listar())


@router.post("")
async def adicionar_produto(produto: ProductMappingItem):
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