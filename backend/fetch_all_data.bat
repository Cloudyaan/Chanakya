
@echo off
echo Running Microsoft 365 Data Fetcher
echo ====================================================
echo.
echo Fetching Message Center Updates...
python fetch_updates.py %*
echo.
echo Fetching License Data...
python fetch_licenses.py %*
echo.
echo Done!
pause
