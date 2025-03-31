
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

# Set default email configuration if not provided
if 'SMTP_SERVER' not in os.environ:
    os.environ['SMTP_SERVER'] = 'smtp.gmail.com'
    
if 'SMTP_PORT' not in os.environ:
    os.environ['SMTP_PORT'] = '587'
    
if 'SMTP_USER' not in os.environ:
    os.environ['SMTP_USER'] = ''  # Set your default SMTP username here
    
if 'SMTP_PASSWORD' not in os.environ:
    os.environ['SMTP_PASSWORD'] = ''  # Set your default SMTP password here
    
if 'SENDER_EMAIL' not in os.environ:
    os.environ['SENDER_EMAIL'] = 'noreply@example.com'

# Print email configuration for debugging
print("Email Configuration:")
print(f"SMTP Server: {os.environ.get('SMTP_SERVER')}")
print(f"SMTP Port: {os.environ.get('SMTP_PORT')}")
print(f"Sender Email: {os.environ.get('SENDER_EMAIL')}")
print(f"SMTP User configured: {'Yes' if os.environ.get('SMTP_USER') else 'No'}")

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
