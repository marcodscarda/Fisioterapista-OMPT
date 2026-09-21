@echo off
REM ============================================================
REM   Mette l'icona del Gestionale OMPT sul Desktop (Windows).
REM
REM   Doppio clic su questo file: crea sul Desktop il
REM   collegamento "Gestionale OMPT", con cui aprire il
REM   gestionale in un colpo solo.
REM
REM   Va eseguito una sola volta, e di nuovo solo se sposti
REM   questa cartella.
REM ============================================================

setlocal
cd /d "%~dp0"
title Gestionale OMPT - crea icona

echo.
echo   Creo il collegamento "Gestionale OMPT" sul Desktop.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$s = (New-Object -ComObject WScript.Shell);" ^
  "$lnk = $s.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\Gestionale OMPT.lnk');" ^
  "$lnk.TargetPath = '%~dp0Avvia gestionale.bat';" ^
  "$lnk.WorkingDirectory = '%~dp0';" ^
  "$lnk.Description = 'Gestionale OMPT - cartella clinica, fatture e incassi';" ^
  "$ico = '%~dp0app\icone\gestionale.ico'; if (Test-Path $ico) { $lnk.IconLocation = $ico };" ^
  "$lnk.Save()"

if errorlevel 1 (
  echo   Non sono riuscito a creare il collegamento.
  echo   Puoi comunque avviare il gestionale con "Avvia gestionale.bat".
) else (
  echo   Fatto.
  echo.
  echo   Sul Desktop ora trovi l'icona "Gestionale OMPT".
  echo   Un doppio clic la apre: il gestionale si presenta da solo nel browser.
  echo.
  echo   Se sposti questa cartella, esegui di nuovo questo file.
)
echo.
pause
