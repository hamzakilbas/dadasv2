@echo off
title Dadas Tatlici POS Sistemi
cd /d "%~dp0"

:: 1. Sunucuyu arka planda baslat
start "" /b npm run preview

:: 2. Sunucunun ayaga kalkmasi icin 2 saniye bekle (ERR_CONNECTION_REFUSED hatasini onler)
timeout /t 2 /nobreak >nul

:: 3. Tarayicida uygulamayi ac
start http://localhost:4173/
