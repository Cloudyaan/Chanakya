
# Chanakya Backend

This is the Python backend for the Chanakya application.

## Setup

1. Create a virtual environment:
   ```
   python -m venv venv
   ```

2. Activate the virtual environment:
   - On Windows: `venv\Scripts\activate`
   - On macOS/Linux: `source venv/bin/activate`

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Run the application:
   ```
   python app.py
   ```

The server will start on http://localhost:5000

## API Endpoints

### M365 Tenants
- GET `/api/tenants` - Get all tenants
- POST `/api/tenants` - Add a new tenant
- PUT `/api/tenants/:id` - Update a tenant
- DELETE `/api/tenants/:id` - Delete a tenant

### Azure Accounts
- GET `/api/azure` - Get all Azure accounts
- POST `/api/azure` - Add a new Azure account
- PUT `/api/azure/:id` - Update an Azure account
- DELETE `/api/azure/:id` - Delete an Azure account
