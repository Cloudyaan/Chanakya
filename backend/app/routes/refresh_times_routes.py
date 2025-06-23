
from flask import Blueprint, request, jsonify
from app.database import get_db_connection
import logging

# Create Blueprint
refresh_times_bp = Blueprint('refresh_times', __name__)

@refresh_times_bp.route('/refresh-times', methods=['GET'])
def get_refresh_times():
    """Get the last refresh times for auto-fetch operations"""
    try:
        tenant_id = request.args.get('tenantId')
        
        if not tenant_id:
            return jsonify({'error': 'tenantId parameter is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create the table if it doesn't exist
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS auto_fetch_refresh_log (
                id VARCHAR(100) PRIMARY KEY,
                tenant_id VARCHAR(50),
                data_type VARCHAR(50),
                last_refresh_time DATETIME,
                status VARCHAR(20) DEFAULT 'success',
                UNIQUE(tenant_id, data_type)
            )
        ''')
        
        # Get refresh times for this tenant
        cursor.execute('''
            SELECT tenant_id, data_type, last_refresh_time, status
            FROM auto_fetch_refresh_log 
            WHERE tenant_id = ?
            ORDER BY last_refresh_time DESC
        ''', (tenant_id,))
        
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Convert to list of dictionaries
        refresh_times = []
        for row in results:
            refresh_times.append({
                'tenant_id': row[0],
                'data_type': row[1],
                'last_refresh_time': row[2],
                'status': row[3]
            })
        
        logging.info(f"Retrieved {len(refresh_times)} refresh times for tenant {tenant_id}")
        return jsonify(refresh_times)
        
    except Exception as e:
        logging.error(f"Error getting refresh times: {e}")
        return jsonify({'error': 'Failed to get refresh times'}), 500
