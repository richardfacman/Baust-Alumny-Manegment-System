@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File ".\run-project.ps1" -StartPhp
start "" "http://127.0.0.1:8000/"
pause
