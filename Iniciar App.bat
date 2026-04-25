@echo off
title Colmeias - Gestao de Encomendas
echo.
echo  ==========================================
echo   COLMEIAS - Sistema de Encomendas
echo  ==========================================
echo.
echo  A verificar dependencias...

pip show fastapi >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo  A instalar dependencias pela primeira vez...
    pip install -r requirements.txt
    echo  Instalacao concluida!
    echo.
)

echo  A iniciar servidor...
echo  Abre o browser em: http://localhost:8000
echo.
echo  [Para fechar a aplicacao, fecha esta janela]
echo.

start "" http://localhost:8000
python main.py
pause
