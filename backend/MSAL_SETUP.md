
# Setting up MSAL for Microsoft 365 Message Center Updates

This document explains how to set up the Microsoft Authentication Library (MSAL) to fetch message center updates from Microsoft 365.

## Prerequisites

1. Python 3.6 or later
2. Flask and other dependencies installed (see requirements.txt)

## Installing MSAL

To install the MSAL package, run:

```bash
pip install msal
```

Or update all dependencies at once:

```bash
pip install -r requirements.txt
```

## Troubleshooting MSAL Installation Issues

If you encounter errors installing MSAL:

1. Make sure your Python environment is properly set up
2. Try upgrading pip: `pip install --upgrade pip`
3. If you're using a virtual environment, ensure it's activated
4. On Windows, you might need to run as administrator

## Fetching Message Center Updates

After installing MSAL, you can fetch updates by:

1. Running the Flask server: `python app.py`
2. Running the fetch script: `python fetch_updates.py`

The fetch script can be run for all tenants or for a specific tenant by providing the tenant ID as an argument:

```bash
python fetch_updates.py <tenant_id>
```

Or use the batch file:

```bash
fetch_updates.bat <tenant_id>
```
