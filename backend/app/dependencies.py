
import importlib.util
import subprocess
import sys

def check_dependencies():
    """Check if required packages are installed and install them if missing."""
    required_packages = ['msal', 'pandas', 'requests', 'feedparser', 'python-dateutil']
    missing_packages = []
    
    for package in required_packages:
        spec = importlib.util.find_spec(package)
        if spec is None:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"Warning: Missing required packages: {', '.join(missing_packages)}")
        print("Installing missing packages...")
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install'] + missing_packages)
            print("Successfully installed missing packages")
            return True
        except subprocess.CalledProcessError:
            print("Error installing packages. Please install them manually:")
            for package in missing_packages:
                print(f"  pip install {package}")
            return False
    
    return True

def create_batch_files():
    """Create necessary batch files for Windows compatibility."""
    batch_files = {
        'fetch_licenses.bat': '''@echo off
python fetch_licenses.py %*
''',
        'fetch_windows_updates.bat': '''@echo off
echo Running Windows Updates Fetcher
echo ====================================================
echo.

REM Check if pandas is installed
python -c "import pandas" 2>NUL
if %ERRORLEVEL% NEQ 0 (
    echo Error: pandas package is not installed.
    echo Installing pandas...
    pip install pandas
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to install pandas. Please install it manually: pip install pandas
        exit /b 1
    )
)

python fetch_windows_updates.py %*

echo.
echo Done!
''',
        'fetch_m365_news.bat': '''@echo off
echo Running Microsoft 365 News Fetcher
echo ====================================================
echo.

REM Check if required packages are installed
python -c "import feedparser" 2>NUL
if %ERRORLEVEL% NEQ 0 (
    echo Error: feedparser package is not installed.
    echo Installing feedparser...
    pip install feedparser
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to install feedparser. Please install it manually: pip install feedparser
        exit /b 1
    )
)

python -c "import dateutil" 2>NUL
if %ERRORLEVEL% NEQ 0 (
    echo Error: python-dateutil package is not installed.
    echo Installing python-dateutil...
    pip install python-dateutil
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to install python-dateutil. Please install it manually: pip install python-dateutil
        exit /b 1
    )
)

python fetch_m365_news.py %*

echo.
echo Done!
'''
    }
    
    import os
    for filename, content in batch_files.items():
        if not os.path.exists(filename):
            with open(filename, 'w') as f:
                f.write(content)
            print(f"Created {filename}")

