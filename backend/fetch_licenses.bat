
@echo off
echo Running Microsoft 365 License Fetcher
echo =====================================
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

python fetch_licenses.py %*

echo.
echo Done!
