@echo off
cd /d "%~dp0"
set "NODE_EXE=node"
if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" set "NODE_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
start "Triangle Healthy Kitchen Server" cmd /k ""%NODE_EXE%" server.js"
timeout /t 2 >nul
start "" http://127.0.0.1:4173/
