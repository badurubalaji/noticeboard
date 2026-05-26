@echo off
REM ---------------------------------------------------------------------------
REM  NoticeBoard - Windows one-click setup
REM
REM  Just double-click this file. It will:
REM    1. Install Node.js and MongoDB if they're missing (via winget).
REM    2. Generate secrets and install dependencies.
REM    3. Start the server, then print the LAN URL to share with TVs.
REM
REM  Re-run anytime to update. To wipe data: setup.cmd --reset
REM ---------------------------------------------------------------------------

setlocal
pushd "%~dp0"

where powershell >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo PowerShell is required but not found. Please update Windows or run setup.ps1 manually.
  popd
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1" %*
set EXITCODE=%ERRORLEVEL%

popd
if %EXITCODE% NEQ 0 (
  echo.
  echo Setup failed with exit code %EXITCODE%. See the messages above.
  pause
)
exit /b %EXITCODE%
