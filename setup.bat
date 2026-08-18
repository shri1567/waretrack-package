@echo off
REM WareTrack - one-command setup script for Windows
setlocal enabledelayedexpansion

echo ==================================================
echo   WareTrack Setup
echo ==================================================
echo.

REM ---- Prerequisite check ----
echo Checking prerequisites...
where node >nul 2>nul || ( echo [X] Node.js not found. Install from https://nodejs.org && exit /b 1 )
where npm >nul 2>nul  || ( echo [X] npm not found. && exit /b 1 )
where mysql >nul 2>nul || ( echo [X] mysql not found. Install MySQL Community Server, then add C:\Program Files\MySQL\MySQL Server 8.x\bin to your PATH && exit /b 1 )
echo [OK] Node, npm, mysql found
echo.

REM ---- DB credentials ----
set "DB_USER=root"
set /p user_input="MySQL user (default: root): "
if not "%user_input%"=="" set "DB_USER=%user_input%"

set /p DB_PASSWORD="MySQL password (leave blank if none): "
echo.

REM ---- Test connection ----
echo Testing MySQL connection...
if "%DB_PASSWORD%"=="" (
    mysql -u %DB_USER% -e "SELECT 1;" >nul 2>nul
    set MYSQL_CMD=mysql -u %DB_USER%
) else (
    mysql -u %DB_USER% -p%DB_PASSWORD% -e "SELECT 1;" >nul 2>nul
    set MYSQL_CMD=mysql -u %DB_USER% -p%DB_PASSWORD%
)
if errorlevel 1 (
    echo [X] Cannot connect to MySQL with those credentials.
    exit /b 1
)
echo [OK] MySQL connection successful
echo.

REM ---- Load database ----
echo ==================================================
echo   Loading Database
echo ==================================================
for %%f in (01_schema.sql 02_functions.sql 03_triggers.sql 04_procedures.sql 05_seed_data.sql) do (
    echo Loading database\%%f ...
    %MYSQL_CMD% < database\%%f
    if errorlevel 1 ( echo [X] Failed loading %%f && exit /b 1 )
)
echo [OK] Database loaded
echo.

REM ---- Backend ----
echo ==================================================
echo   Setting up Backend
echo ==================================================
cd backend
if not exist .env (
    copy .env.example .env >nul
    powershell -Command "(Get-Content .env) -replace 'DB_USER=root', 'DB_USER=%DB_USER%' -replace 'DB_PASSWORD=', 'DB_PASSWORD=%DB_PASSWORD%' | Set-Content .env"
)
call npm install --silent
cd ..
echo [OK] Backend ready
echo.

REM ---- Frontend ----
echo ==================================================
echo   Setting up Frontend
echo ==================================================
cd frontend
call npm install --silent
cd ..
echo [OK] Frontend ready
echo.

REM ---- Done ----
echo ==================================================
echo   Setup Complete!
echo ==================================================
echo.
echo To start the application:
echo   Window 1: cd backend  ^&^& npm run dev
echo   Window 2: cd frontend ^&^& npm run dev
echo.
echo Then open: http://localhost:5173
echo.
pause
