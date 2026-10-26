@echo off
REM ============================================================
REM   Avvio del Gestionale OMPT su Windows.
REM   Doppio clic su questo file. Si apre una finestra nera e il
REM   gestionale si apre da solo nel browser.
REM   Lascia la finestra aperta mentre lo usi.
REM ============================================================

cd /d "%~dp0"
title Gestionale OMPT

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Per usare il gestionale serve Node.js, che non risulta installato.
  echo.
  echo   Sto aprendo la pagina da cui scaricarlo: installa la versione LTS,
  echo   poi torna qui e fai di nuovo doppio clic su questo file.
  echo.
  start "" "https://nodejs.org/it/download"
  pause
  exit /b 1
)

node server.js %*
echo.
echo   Il gestionale e' stato chiuso.
pause
