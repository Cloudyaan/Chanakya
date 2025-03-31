
import os
import sys
from app.database import init_db
from app.dependencies import check_dependencies, create_batch_files
from app import create_app

# Initialize database tables
init_db()

# Check dependencies
check_dependencies()

# Create required batch files
create_batch_files()

# Set default Microsoft Graph API configuration if not provided
if 'MS_CLIENT_ID' not in os.environ:
    os.environ['MS_CLIENT_ID'] = '20f55c5a-ce0b-4992-ad84-a9942b803d9c'
    
if 'MS_CLIENT_SECRET' not in os.environ:
    os.environ['MS_CLIENT_SECRET'] = 'D5N8Q~mmsiQZt9X1PTt6BXRjTnPnIA8nWJU3bc5e'
    
if 'MS_TENANT_ID' not in os.environ:
    os.environ['MS_TENANT_ID'] = '99f07988-2bcb-46c0-b418-b7c4b1834934'
    
if 'MS_FROM_EMAIL' not in os.environ:
    os.environ['MS_FROM_EMAIL'] = 'admin_ar@noyarkmwp.com'

# Print email configuration for debugging
print("Microsoft Graph Email Configuration:")
print(f"Client ID: {os.environ.get('MS_CLIENT_ID')}")
print(f"Tenant ID: {os.environ.get('MS_TENANT_ID')}")
print(f"From Email: {os.environ.get('MS_FROM_EMAIL')}")
print(f"Client Secret configured: {'Yes' if os.environ.get('MS_CLIENT_SECRET') else 'No'}")

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
