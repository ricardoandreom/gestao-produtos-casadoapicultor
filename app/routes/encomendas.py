"""Rotas API das encomendas."""

from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse

from app import config
from app.models import EncomendaRequest
from app.services import historico as historico_service


router = APIRouter(prefix="/api/encomendas", tags=["encomendas"])

TIPOS_DOCUMENTO_VALIDOS = ("maquinacao", "etiquetas", "acabamento")


def _validar_payload(encomenda: EncomendaRequest):
    """Validações partilhadas entre POST e PUT."""
    if encomenda.cliente_tipo not in config.CLIENTE_TIPOS:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de cliente inválido. Use: {', '.join(config.CLIENTE_TIPOS)}.",
        )
    if not encomenda.produtos:
        raise HTTPException(
            status_code=400,
            detail="A encomenda deve ter pelo menos um produto.",
        )


@router.post("")
async def criar_encomenda(encomenda: EncomendaRequest):
    _validar_payload(encomenda)

    try:
        nova = historico_service.criar(
            cliente=encomenda.cliente,
            cliente_tipo=encomenda.cliente_tipo,
            produtos=encomenda.produtos,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar documentos Word: {e}")

    return JSONResponse(content={
        "sucesso": True,
        "id": nova["id"],
        "mensagem": f"Encomenda #{nova['id']} criada com sucesso!",
    })


@router.put("/{encomenda_id}")
async def editar_encomenda(encomenda_id: int, encomenda: EncomendaRequest):
    _validar_payload(encomenda)

    try:
        atualizada = historico_service.editar(
            encomenda_id=encomenda_id,
            cliente=encomenda.cliente,
            cliente_tipo=encomenda.cliente_tipo,
            produtos=encomenda.produtos,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao regenerar documentos: {e}")

    if atualizada is None:
        raise HTTPException(status_code=404, detail="Encomenda não encontrada.")

    return JSONResponse(content={
        "sucesso": True,
        "id": atualizada["id"],
        "mensagem": f"Encomenda #{atualizada['id']} atualizada com sucesso!",
    })


@router.delete("/{encomenda_id}")
async def apagar_encomenda(encomenda_id: int):
    apagou = historico_service.apagar(encomenda_id)
    if not apagou:
        raise HTTPException(status_code=404, detail="Encomenda não encontrada.")

    return JSONResponse(content={
        "sucesso": True,
        "mensagem": f"Encomenda #{encomenda_id} apagada com sucesso!",
    })


@router.get("")
async def listar_encomendas():
    return JSONResponse(content=historico_service.carregar())


@router.get("/{encomenda_id}/download/{tipo}")
async def download_encomenda(encomenda_id: int, tipo: str):
    if tipo not in TIPOS_DOCUMENTO_VALIDOS:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo inválido. Use: {', '.join(TIPOS_DOCUMENTO_VALIDOS)}.",
        )

    historico = historico_service.carregar()
    encomenda = historico_service.encontrar(historico, encomenda_id)
    if not encomenda:
        raise HTTPException(status_code=404, detail="Encomenda não encontrada.")

    caminho = historico_service.caminho_documento(encomenda, tipo)
    if not caminho:
        raise HTTPException(status_code=404, detail=f"Documento '{tipo}' não encontrado.")

    return FileResponse(
        path=caminho,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=Path(caminho).name,
    )


# --- Endpoint de exportação (separado por design) ---

excel_router = APIRouter(tags=["encomendas"])


@excel_router.get("/api/exportar-excel")
async def download_excel():
    if not config.EXCEL_EXPORT.exists():
        from app.services.excel_export import exportar_excel
        exportar_excel(historico_service.carregar())

    return FileResponse(
        path=str(config.EXCEL_EXPORT),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename="historico_encomendas.xlsx",
    )