"""Rotas das páginas HTML (renderização de templates)."""

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from app import config


router = APIRouter()
templates = Jinja2Templates(directory=str(config.TEMPLATES_DIR))


@router.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse(request, "index.html")


@router.get("/graficos", response_class=HTMLResponse)
async def graficos(request: Request):
    return templates.TemplateResponse(request, "graficos.html")


@router.get("/mapeamento", response_class=HTMLResponse)
async def mapeamento(request: Request):
    return templates.TemplateResponse(request, "mapeamento.html")