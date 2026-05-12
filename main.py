"""Ponto de entrada da aplicação Casa do Apicultor — Gestão de Encomendas.

Este ficheiro é deliberadamente curto: só cria a app, monta os ficheiros
estáticos e regista as rotas. Toda a lógica vive em `app/`.
"""

import shutil
from datetime import date
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app import config
from app.routes import register_all


def _backup_historico():
    """Faz uma cópia diária do historico.json em data/backups/ no arranque."""
    backup_dir = config.DATA_DIR / "backups"
    backup_dir.mkdir(exist_ok=True)
    if config.DATA_FILE.exists():
        dest = backup_dir / f"historico_{date.today().isoformat()}.json"
        if not dest.exists():
            shutil.copy2(config.DATA_FILE, dest)


def criar_app() -> FastAPI:
    """Cria e configura a instância FastAPI."""
    config.garantir_pastas()
    _backup_historico()

    app = FastAPI(title="Gestão de Encomendas - Colmeias")
    app.mount("/static", StaticFiles(directory=str(config.STATIC_DIR)), name="static")
    register_all(app)
    return app


app = criar_app()


if __name__ == "__main__":
    import threading
    import time
    import webbrowser
    import uvicorn

    def abrir_browser():
        time.sleep(1.5)
        webbrowser.open("http://localhost:8000")

    threading.Thread(target=abrir_browser, daemon=True).start()
    uvicorn.run(app, host="0.0.0.0", port=8000)