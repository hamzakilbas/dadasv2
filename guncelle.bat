@echo off
title PosMaster Guncelleniyor...
cd /d "%~dp0"

:: 1. Arka planda calisan eski Node/Preview sunucusunu kapat
taskkill /f /im node.exe >nul 2>&1

:: 2. Kod degisikliklerini yeniden derle
call npm run build

:: 3. Yeni derlemeyi arka planda sessizce tekrar baslat
wscript PosMaster.vbs