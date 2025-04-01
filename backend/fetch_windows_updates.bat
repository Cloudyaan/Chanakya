
@echo off
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

REM Check for numpy/pandas compatibility issue
python -c "import pandas" 2>NUL
if %ERRORLEVEL% NEQ 0 (
    echo Detected potential numpy/pandas compatibility issue.
    echo Reinstalling numpy and pandas...
    pip install --force-reinstall numpy
    pip install --force-reinstall pandas
)

python fetch_windows_updates.py %*

echo.
echo Done!
