@echo off
REM GIS Tool Setup Script for Windows

echo.
echo ========================================
echo GIS Park Management Tool - Setup
echo ========================================
echo.

REM Check Python version
echo Checking Python version...
python --version

if %errorlevel% neq 0 (
    echo Error: Python not found. Please install Python first.
    pause
    exit /b 1
)

echo.
echo Checking pip...
pip --version

if %errorlevel% neq 0 (
    echo Error: pip not found.
    pause
    exit /b 1
)

echo.
echo Installing required packages...
pip install click tabulate

echo.
echo Checking Django...
python -c "import django; print(f'Django {django.get_version()} is installed')" 

if %errorlevel% neq 0 (
    echo Installing Django...
    pip install Django
)

echo.
echo ==========================================
echo Setup completed successfully!
echo.
echo To get started, run:
echo   python gis_tool.py --help
echo.
echo To see available commands:
echo   python gis_tool.py
echo ==========================================
echo.
pause
