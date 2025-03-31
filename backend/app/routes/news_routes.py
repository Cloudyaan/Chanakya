
from flask import Blueprint, request, jsonify
import sqlite3
import json
import subprocess
import os

from app.database import get_db_connection, find_tenant_database

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
    
    # Check if the tenant exists
    conn = get_db_connection()
    cursor = conn.cursor()
    tenant = cursor.execute('SELECT * FROM tenants WHERE id = ?', (tenant_id,)).fetchone()
    conn.close()
    
    if not tenant:
        return jsonify({
            'error': 'Tenant not found',
            'message': f'No tenant found with ID {tenant_id}'
        }), 404
    
    try:
        # Find the tenant database
        tenant_db_path = find_tenant_database(tenant['tenantId'])
        
        if not tenant_db_path:
            print(f"No database found for tenant {tenant['name']} (ID: {tenant_id})")
            return jsonify([])  # Return empty array if database not found
        
        # Connect to the tenant database
        conn = sqlite3.connect(tenant_db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Check if the m365_news table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='m365_news'")
        if not cursor.fetchone():
            print(f"m365_news table not found in database for tenant {tenant['name']}")
            return jsonify([])  # Return empty array if table doesn't exist
        
        # Get the news entries
        cursor.execute('''
            SELECT * FROM m365_news
            ORDER BY published_date DESC
        ''')
        
        news = []
        for row in cursor.fetchall():
            news_item = dict(row)
            
            # Parse categories from JSON
            if 'categories' in news_item and news_item['categories']:
                try:
                    if isinstance(news_item['categories'], str):
                        news_item['categories'] = json.loads(news_item['categories'])
                    # If categories is already a list, keep it as is
                except (json.JSONDecodeError, TypeError) as e:
                    print(f"Error parsing categories JSON: {e}")
                    news_item['categories'] = []
            else:
                news_item['categories'] = []
            
            # Add tenant information
            news_item['tenantId'] = tenant['tenantId']
            news_item['tenantName'] = tenant['name']
            
            news.append(news_item)
        
        conn.close()
        print(f"Returning {len(news)} news items for tenant {tenant_id}")
        return jsonify(news)
        
    except sqlite3.Error as e:
        print(f"Database error: {str(e)}")
        return jsonify({
            'error': 'Database error',
            'message': str(e)
        }), 500
    except Exception as e:
        print(f"Server error: {str(e)}")
        return jsonify({
            'error': 'Server error',
            'message': str(e)
        }), 500

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
    tenant = cursor.execute('SELECT * FROM tenants WHERE id = ?', (tenant_id,)).fetchone()
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
            subprocess.run(['fetch_m365_news.bat', tenant_id], check=True)
        else:
            # On non-Windows, run the Python script directly
            subprocess.run(['python', 'fetch_m365_news.py', tenant_id], check=True)
        
        return jsonify({
            'success': True,
            'message': f'Successfully fetched M365 news for tenant {tenant["name"]}'
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
