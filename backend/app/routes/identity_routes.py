
from flask import Blueprint, request, jsonify
import uuid
from datetime import datetime
from app.database import get_db_connection

# Create Blueprint
identity_bp = Blueprint('identity', __name__)

@identity_bp.route('/identity-providers', methods=['GET'])
def get_identity_providers():
    """Retrieve all identity providers"""
    conn = get_db_connection()
    providers = conn.execute('SELECT * FROM identity_providers').fetchall()
    conn.close()
    
    # Convert to list of dictionaries
    result = []
    for provider in providers:
        # Convert isEnabled from integer to boolean
        provider_dict = dict(provider)
        provider_dict['isEnabled'] = bool(provider_dict['isEnabled'])
        result.append(provider_dict)
        
    return jsonify(result)

@identity_bp.route('/identity-providers', methods=['POST'])
def add_identity_provider():
    """Add a new identity provider"""
    data = request.json
    
    # Generate UUID and add timestamp
    provider_id = str(uuid.uuid4())
    date_added = datetime.now().isoformat()
    
    conn = get_db_connection()
    
    try:
        # Convert boolean to integer for SQLite storage
        is_enabled_int = 1 if data.get('isEnabled') else 0
        
        conn.execute(
            'INSERT INTO identity_providers (id, name, tenantId, clientId, clientSecret, redirectUri, isEnabled, dateAdded) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            (
                provider_id,
                data['name'],
                data['tenantId'], 
                data['clientId'],
                data['clientSecret'],
                data['redirectUri'],
                is_enabled_int,
                date_added
            )
        )
        conn.commit()
        
        # Return the newly created provider with ID
        return jsonify({
            **data,
            'id': provider_id,
            'dateAdded': date_added
        }), 201
    except Exception as e:
        conn.rollback()
        print(f"Error adding identity provider: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@identity_bp.route('/identity-providers/<string:provider_id>', methods=['PUT'])
def update_identity_provider(provider_id):
    """Update an existing identity provider"""
    data = request.json
    
    conn = get_db_connection()
    
    try:
        # Check if provider exists
        provider = conn.execute('SELECT * FROM identity_providers WHERE id = ?', (provider_id,)).fetchone()
        if not provider:
            return jsonify({'error': 'Identity provider not found'}), 404
        
        # Convert boolean to integer for SQLite storage
        is_enabled_int = 1 if data.get('isEnabled') else 0
        
        conn.execute(
            'UPDATE identity_providers SET name = ?, tenantId = ?, clientId = ?, clientSecret = ?, redirectUri = ?, isEnabled = ? WHERE id = ?',
            (
                data['name'],
                data['tenantId'],
                data['clientId'],
                data['clientSecret'],
                data['redirectUri'],
                is_enabled_int,
                provider_id
            )
        )
        conn.commit()
        
        return jsonify({**data, 'id': provider_id}), 200
    except Exception as e:
        conn.rollback()
        print(f"Error updating identity provider: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@identity_bp.route('/identity-providers/<string:provider_id>', methods=['DELETE'])
def delete_identity_provider(provider_id):
    """Delete an identity provider"""
    conn = get_db_connection()
    
    try:
        # Check if provider exists
        provider = conn.execute('SELECT * FROM identity_providers WHERE id = ?', (provider_id,)).fetchone()
        if not provider:
            return jsonify({'error': 'Identity provider not found'}), 404
        
        conn.execute('DELETE FROM identity_providers WHERE id = ?', (provider_id,))
        conn.commit()
        
        return '', 204
    except Exception as e:
        conn.rollback()
        print(f"Error deleting identity provider: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()
