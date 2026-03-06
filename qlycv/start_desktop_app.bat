@echo off
REM GIS Desktop Application - Launcher
REM Lightweight Tkinter version (no additional dependencies)

echo.
echo ========================================
echo GIS Park Management System - Desktop App
echo ========================================
echo.

REM Launch the Tkinter desktop app
python gis_desktop_app_lite.py

if %errorlevel% neq 0 (
    echo.
    echo Error: Failed to start application.
    echo Make sure Django is configured and database is set up.
    pause
)
