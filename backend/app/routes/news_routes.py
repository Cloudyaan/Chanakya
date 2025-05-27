
from flask import Blueprint, request, jsonify
import subprocess
import os

from app.database import get_db_connection, get_tenant_table_connection, ensure_tenant_tables_exist

news_bp = Blueprint('news', __name__, url_prefix='/api')

@news_bp.route('/m365-news', methods=['GET'])
def get_m365_news():
    tenant_id = request.args.get('tenantId')
    
    # If no tenant ID is specified, return an error
    if not tenant_id:
        return jsonify({
            'error': 'Tenant ID is required',
            'message': 'Please specify a tenantId parameter'
        }), 400
    
    # Try to find the tenant
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM tenants WHERE id = ?', (tenant_id,))
    tenant = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not tenant:
        return jsonify({
            'error': 'Tenant not found',
            'message': f'No tenant found with ID {tenant_id}'
        }), 404
    
    try:
        # Convert pyodbc.Row to dictionary for easier access
        tenant_dict = {
            'id': tenant[0],
            'name': tenant[1],
            'tenantId': tenant[2],
            'applicationId': tenant[3],
            'applicationSecret': tenant[4],
            'isActive': bool(tenant[5]),
            'dateAdded': tenant[6]
        }
        
        # Ensure tenant tables exist
        table_exists = ensure_tenant_tables_exist(tenant_dict['id'], 'm365')
        if not table_exists:
            print(f"Failed to ensure tables exist for tenant: {tenant_dict['name']} (ID: {tenant_id})")
            return jsonify([])  # Return empty array if database not found
        
        # Get connection and table name for tenant-specific operations
        conn, table_name = get_tenant_table_connection(tenant_dict['id'], 'news', 'm365')
        if not conn or not table_name:
            print(f"Failed to get table connection for tenant: {tenant_dict['name']} (ID: {tenant_id})")
            return jsonify([])  # Return empty array if table doesn't exist
        
        # Connect to the Azure SQL database and fetch news
        try:
            cursor = conn.cursor()
            
            # Check if the news table exists
            cursor.execute(f"""
                SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = '{table_name}'
            """)
            table_exists = cursor.fetchone()[0] > 0
            
            if not table_exists:
                print(f"News table {table_name} does not exist for tenant: {tenant_dict['name']}")
                conn.close()
                return jsonify([])  # Return empty array if table doesn't exist
            
            print(f"Found news table: {table_name} for tenant: {tenant_dict['name']}")
            
            # Query the news table
            cursor.execute(f"""
                SELECT 
                    id,
                    title,
                    published_date,
                    link,
                    summary,
                    categories,
                    fetch_date
                FROM {table_name}
                ORDER BY published_date DESC
            """)
            
            news = []
            rows = cursor.fetchall()
            print(f"Found {len(rows)} news items in table {table_name}")
            
            for row in rows:
                # Convert to dictionary
                news_item = {
                    'id': row[0],
                    'title': row[1],
                    'published_date': row[2],
                    'link': row[3],
                    'summary': row[4],
                    'categories': row[5],
                    'fetch_date': row[6]
                }
                
                # Parse categories from JSON string if needed
                if news_item['categories'] and isinstance(news_item['categories'], str):
                    try:
                        import json
                        news_item['categories'] = json.loads(news_item['categories'])
                    except (json.JSONDecodeError, TypeError):
                        news_item['categories'] = []
                elif not news_item['categories']:
                    news_item['categories'] = []
                
                # Add tenant information
                news_item['tenantId'] = tenant_dict['id']
                news_item['tenantName'] = tenant_dict['name']
                
                news.append(news_item)
            
            conn.close()
            print(f"Returning {len(news)} news items for tenant: {tenant_dict['name']}")
            return jsonify(news)
            
        except Exception as e:
            error_msg = f"Database error reading from {table_name}: {str(e)}"
            print(error_msg)
            if conn:
                conn.close()
            return jsonify([])  # Return empty array instead of error
            
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        print(error_msg)
        return jsonify([])  # Return empty array instead of error

@news_bp.route('/fetch-m365-news', methods=['POST'])
def trigger_fetch_m365_news():
    tenant_id = request.json.get('tenantId')
    
    if not tenant_id:
        return jsonify({
            'error': 'Tenant ID is required',
            'message': 'Please specify a tenantId in the request body'
        }), 400
    
    # Check if the tenant exists
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM tenants WHERE id = ?', (tenant_id,))
    tenant = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not tenant:
        return jsonify({
            'error': 'Tenant not found',
            'message': f'No tenant found with ID {tenant_id}'
        }), 404
    
    try:
        print(f"Attempting to fetch M365 news for tenant ID: {tenant_id}")
        
        # On Windows, run the batch file
        if os.name == 'nt':
            # Print the current directory for debugging
            print(f"Current directory: {os.getcwd()}")
            print(f"Running command: fetch_m365_news.bat {tenant_id}")
            
            # Use absolute paths or ensure the batch file is in the right directory
            fetch_script = os.path.join(os.getcwd(), 'fetch_m365_news.bat')
            if not os.path.exists(fetch_script):
                print(f"Warning: fetch_m365_news.bat not found at {fetch_script}")
                
            # Try different ways to run the batch file
            try:
                subprocess.run(['fetch_m365_news.bat', tenant_id], check=True)
            except Exception as batch_error:
                print(f"Error running batch file directly: {str(batch_error)}")
                try:
                    # Try with cmd /c
                    subprocess.run(['cmd', '/c', 'fetch_m365_news.bat', tenant_id], check=True)
                except Exception as cmd_error:
                    print(f"Error running with cmd /c: {str(cmd_error)}")
                    # As a last resort, try with python
                    subprocess.run(['python', 'fetch_m365_news.py', tenant_id], check=True)
        else:
            # On non-Windows, run the Python script directly
            print(f"Running command: python fetch_m365_news.py {tenant_id}")
            subprocess.run(['python', 'fetch_m365_news.py', tenant_id], check=True)
        
        return jsonify({
            'success': True,
            'message': f'Successfully fetched M365 news for tenant {tenant[1]}'  # Access by index
        })
    except subprocess.CalledProcessError as e:
        print(f"Error running fetch_m365_news script: {str(e)}")
        return jsonify({
            'error': 'Fetch news failed',
            'message': f'Error running fetch_m365_news script: {str(e)}'
        }), 500
    except Exception as e:
        print(f"Server error when fetching M365 news: {str(e)}")
        return jsonify({
            'error': 'Server error',
            'message': f'Unexpected error: {str(e)}'
        }), 500
