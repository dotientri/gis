@echo off
REM GIS Desktop App Launcher for Windows

echo.
echo ========================================
echo GIS Park Management System - Desktop App
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python not found. Please install Python first.
    pause
    exit /b 1
)

REM Check if PyQt5 is installed
python -c "import PyQt5" >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing PyQt5...
    pip install PyQt5 -q
)

REM Launch the desktop app
echo Starting GIS Park Management Desktop Application...
python gis_desktop_app.py

if %errorlevel% neq 0 (
    echo.
    echo Error: Failed to start application.
    echo Make sure Django is configured and database is set up.
    pause
)
