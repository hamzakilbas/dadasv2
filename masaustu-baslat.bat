@echo off
title Dadas Tatlici Masaustu POS
cd /d "%~dp0"

:: Derle ve dogrudan masaustu penceresinde ac
call npm run electron:start
