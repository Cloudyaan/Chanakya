
import os
import sys
from dotenv import load_dotenv
from app.database import init_db
from app.dependencies import check_dependencies
from app import create_app
from scheduler_service import scheduler

# Load environment variables from .env file
load_dotenv()

# Check for required Azure SQL Database environment variables
required_azure_vars = [
    'AZURE_SQL_SERVER',
    'AZURE_SQL_DATABASE', 
    'AZURE_SQL_USERNAME',
    'AZURE_SQL_PASSWORD'
]

missing_vars = [var for var in required_azure_vars if not os.environ.get(var)]

if missing_vars:
    print("=" * 60)
    print("WARNING: Missing Azure SQL Database Environment Variables")
    print("=" * 60)
    print("The following environment variables are required:")
    for var in missing_vars:
        print(f"  - {var}")
    print("\nPlease set these environment variables before running the application.")
    print("See backend/.env.example for reference.")
    print("=" * 60)
    sys.exit(1)

# Initialize database tables
try:
    init_db()
    print("Azure SQL Database tables initialized successfully")
except Exception as e:
    print(f"Error initializing Azure SQL Database: {e}")
    sys.exit(1)

# Check dependencies
check_dependencies()

# Set default Microsoft Graph API configuration if not provided
if 'MS_CLIENT_ID' not in os.environ:
    os.environ['MS_CLIENT_ID'] = '20f55c5a-ce0b-4992-ad84-a9942b803d9c'
    
if 'MS_CLIENT_SECRET' not in os.environ:
    os.environ['MS_CLIENT_SECRET'] = 'D5N8Q~mmsiQZt9X1PTt6BXRjTnPnIA8nWJU3bc5e'
    
if 'MS_TENANT_ID' not in os.environ:
    os.environ['MS_TENANT_ID'] = '99f07988-2bcb-46c0-b418-b7c4b1834934'
    
if 'MS_FROM_EMAIL' not in os.environ:
    os.environ['MS_FROM_EMAIL'] = 'admin_ar@noyarkmwp.com'

# Print configuration for debugging
print("Database Configuration:")
print(f"Azure SQL Server: {os.environ.get('AZURE_SQL_SERVER')}")
print(f"Azure SQL Database: {os.environ.get('AZURE_SQL_DATABASE')}")
print(f"Azure SQL Username: {os.environ.get('AZURE_SQL_USERNAME')}")
print("Azure SQL Password: ***configured***" if os.environ.get('AZURE_SQL_PASSWORD') else "Not configured")

print("\nMicrosoft Graph Email Configuration:")
print(f"Client ID: {os.environ.get('MS_CLIENT_ID')}")
print(f"Tenant ID: {os.environ.get('MS_TENANT_ID')}")
print(f"From Email: {os.environ.get('MS_FROM_EMAIL')}")
print(f"Client Secret configured: {'Yes' if os.environ.get('MS_CLIENT_SECRET') else 'No'}")

if __name__ == '__main__':
    # Start the data fetch scheduler
    print("Starting tenant data scheduler...")
    scheduler.start()
    
    app = create_app()
    try:
        app.run(debug=True, port=5000)
    finally:
        # Stop the scheduler when the app shuts down
        scheduler.stop()
