
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
2. Going to the Updates page in the web application and clicking the "Fetch Updates" button

OR

Using the fetch script directly:

```bash
# For Windows:
fetch_updates.bat <tenant_id>

# For macOS/Linux:
python fetch_updates.py <tenant_id>
```

Where `<tenant_id>` is the ID of the tenant you want to fetch updates for.

## Common Errors

If you see the error message "Data Initialization Required" or "MSAL package missing", here are the steps to resolve:

1. Make sure MSAL is installed: `pip install msal`
2. Run the fetch updates script manually: `python fetch_updates.py <tenant_id>`
3. Check that your tenant credentials (Application ID, Application Secret, etc.) are correct
4. Ensure your Azure AD application has the appropriate permissions

## Required Permissions for the Azure AD Application

The Azure AD application used for fetching updates needs the following API permissions:

- Microsoft Graph API:
  - ServiceMessage.Read.All (Application permission)
  - Organization.Read.All (Application permission)

Make sure these permissions are granted and admin consent is provided in the Azure portal.
