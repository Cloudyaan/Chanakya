
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

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
