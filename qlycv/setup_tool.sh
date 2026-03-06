#!/bin/bash
# GIS Tool Setup Script

echo "========================================"
echo "🌳 GIS Park Management Tool - Setup"
echo "========================================"
echo ""

# Check Python version
echo "Checking Python version..."
python_version=$(python --version 2>&1 | awk '{print $2}')
echo "✓ Python version: $python_version"
echo ""

# Check if pip is available
if ! command -v pip &> /dev/null
then
    echo "❌ pip not found. Please install pip first."
    exit 1
fi
echo "✓ pip is available"
echo ""

# Install required packages
echo "Installing required packages..."
pip install click tabulate

echo ""
echo "Checking Django installation..."
python -c "import django; print(f'✓ Django {django.get_version()} is installed')" || {
    echo "❌ Django not found. Installing..."
    pip install Django
}

echo ""
echo "==========================================="
echo "✅ Setup completed successfully!"
echo ""
echo "To get started, run:"
echo "  python gis_tool.py --help"
echo ""
echo "To see available commands:"
echo "  python gis_tool.py"
echo "==========================================="
