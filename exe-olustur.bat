@echo off
title Dadas Tatlici - Windows EXE Olusturucu
cd /d "%~dp0"

echo ===================================================
echo   Dadas Tatlici POS - Windows EXE Paketleme
echo ===================================================
echo.

:: İmza kontrolünü ve internet zaman sunucusu beklemesini kapatır (signtool takılmasını engeller)
set CSC_IDENTITY_AUTO_DISCOVERY=false
set WIN_CSC_LINK=
set CSC_LINK=

echo 1/2: React projesi derleniyor (npm run build)...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [HATA] Derleme basarisiz oldu!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo 2/2: Windows EXE dosyasi olusturuluyor (Imzalama atlandi)...
call npx electron-builder --win portable -c.win.sign=null -c.forceCodeSigning=false -c.win.signAndEditExecutable=false
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [BILGI] Portable tek dosya sikistirma yerine dogrudan calisan klasor kontrol ediliyor...
    if exist "release\win-unpacked\Dadas Tatlici POS.exe" (
        echo [BASARILI] Calisabilir EXE release\win-unpacked\ klasorunde hazir!
    )
)

echo.
echo ===================================================
echo   ISLEM TAMAMLANDI!
echo   Konum: release\ klasoru
echo ===================================================
echo.
if exist "release" (
    start "" explorer "release"
)
pause
