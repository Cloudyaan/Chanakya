
# Microsoft 365 Management Backend

This backend provides API endpoints for managing Microsoft 365 tenants, licenses, and service announcements.

## Setup

1. Install the required Python packages:
```
pip install -r requirements.txt
```

2. Run the Flask application:
```
python app.py
```

## Automatic Data Fetching

When a new tenant is added or an existing tenant is activated, the system will automatically:
1. Run `fetch_updates.py` to retrieve service announcements
2. Run `fetch_licenses.py` to retrieve license information

This requires the MSAL package to be installed:
```
pip install msal
```

## Manual Data Fetching

You can also manually fetch data for a specific tenant:

```
# Fetch service announcements
python fetch_updates.py <tenant_id>

# Fetch license information
python fetch_licenses.py <tenant_id>
```

Where `<tenant_id>` is the ID of the tenant in the database (not the Microsoft tenant ID).

## Database Structure

- `chanakya.db`: Main database containing tenant and Azure account information
- `TenantName_tenantId.db`: Tenant-specific database containing license data and service announcements

## API Endpoints

- GET `/api/tenants`: Get all tenants
- POST `/api/tenants`: Add a new tenant (automatically fetches data if active)
- PUT `/api/tenants/<id>`: Update a tenant (automatically fetches data if newly activated)
- DELETE `/api/tenants/<id>`: Delete a tenant

- GET `/api/licenses?tenantId=<id>`: Get license data for a specific tenant
- GET `/api/updates?tenantId=<id>`: Get service announcements for a specific tenant
