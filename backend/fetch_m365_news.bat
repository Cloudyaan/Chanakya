
@echo off
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

python fetch_m365_news.py %1

echo.
echo Done!
