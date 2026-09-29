@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
if errorlevel 1 (
  echo Installation failed. See the error above.
  pause
  exit /b 1
)
echo Reopen Tabby, then use a native SSH profile and Ctrl+V or Ctrl+Shift+V.
pause
