
from flask import Blueprint, jsonify, request
import sqlite3
import uuid
from datetime import datetime

identity_bp = Blueprint('identity', __name__)

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

@identity_bp.route('/api/identity-providers', methods=['GET'])
def get_identity_providers():
    try:
        conn = sqlite3.connect('chanakya.db')
        conn.row_factory = dict_factory
        cursor = conn.cursor()
        
        # Get all identity providers
        cursor.execute('SELECT * FROM identity_providers')
        providers = cursor.fetchall()
        
        conn.close()
        return jsonify(providers)
    except Exception as e:
        print(f"Error getting identity providers: {str(e)}")
        return jsonify([]), 500

@identity_bp.route('/api/identity-providers', methods=['POST'])
def add_identity_provider():
    try:
        provider = request.json
        provider_id = str(uuid.uuid4())
        
        conn = sqlite3.connect('chanakya.db')
        cursor = conn.cursor()
        
        # Insert new identity provider
        cursor.execute('''
        INSERT INTO identity_providers (
            id, name, tenantId, clientId, clientSecret, redirectUri, isEnabled, dateAdded
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            provider_id,
            provider.get('name'),
            provider.get('tenantId'),
            provider.get('clientId'),
            provider.get('clientSecret'),
            provider.get('redirectUri'),
            1 if provider.get('isEnabled') else 0,
            provider.get('dateAdded') or datetime.now().isoformat()
        ))
        
        conn.commit()
        conn.close()
        
        # Return created provider with ID
        return jsonify({**provider, 'id': provider_id}), 201
    except Exception as e:
        print(f"Error adding identity provider: {str(e)}")
        return jsonify({'error': str(e)}), 500

@identity_bp.route('/api/identity-providers/<id>', methods=['PUT'])
def update_identity_provider(id):
    try:
        provider = request.json
        
        conn = sqlite3.connect('chanakya.db')
        cursor = conn.cursor()
        
        # Update existing identity provider
        cursor.execute('''
        UPDATE identity_providers
        SET name = ?, tenantId = ?, clientId = ?, clientSecret = ?, redirectUri = ?, isEnabled = ?
        WHERE id = ?
        ''', (
            provider.get('name'),
            provider.get('tenantId'),
            provider.get('clientId'),
            provider.get('clientSecret'),
            provider.get('redirectUri'),
            1 if provider.get('isEnabled') else 0,
            id
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify(provider), 200
    except Exception as e:
        print(f"Error updating identity provider: {str(e)}")
        return jsonify({'error': str(e)}), 500

@identity_bp.route('/api/identity-providers/<id>', methods=['DELETE'])
def delete_identity_provider(id):
    try:
        conn = sqlite3.connect('chanakya.db')
        cursor = conn.cursor()
        
        # Delete identity provider
        cursor.execute('DELETE FROM identity_providers WHERE id = ?', (id,))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True}), 200
    except Exception as e:
        print(f"Error deleting identity provider: {str(e)}")
        return jsonify({'error': str(e)}), 500
