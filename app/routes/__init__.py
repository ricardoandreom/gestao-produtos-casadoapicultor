"""Routers da aplicação.

Junta todos os routers e expõe uma função `register_all` que regista
tudo de uma vez na app FastAPI, mantendo o `main.py` curto.
"""

from fastapi import FastAPI

from app.routes import pages, encomendas, produtos


def register_all(app: FastAPI) -> None:
    """Regista todos os routers na app."""
    app.include_router(pages.router)
    app.include_router(encomendas.router)
    app.include_router(encomendas.excel_router)
    app.include_router(produtos.router)