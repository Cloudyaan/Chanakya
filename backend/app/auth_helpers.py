
import os
import jwt
import json
import requests
from functools import wraps
from flask import request, jsonify, current_app, g

def get_token_header():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    return auth_header.replace('Bearer ', '')

def get_jwks(tenant_id):
    """Get the JSON Web Key Set from Microsoft's OIDC discovery endpoint"""
    url = f"https://login.microsoftonline.com/{tenant_id}/discovery/v2.0/keys"
    response = requests.get(url)
    return response.json()

def validate_token(token):
    """Validate JWT token from Azure AD"""
    if not token:
        return None
    
    tenant_id = os.environ.get('MS_TENANT_ID')
    client_id = os.environ.get('MS_CLIENT_ID')  # Your application's client ID
    
    try:
        # Get the JWKS to verify the token
        jwks = get_jwks(tenant_id)
        
        # Decode the header without verification first to get the kid
        header = jwt.get_unverified_header(token)
        
        # Find the key that matches the kid in the header
        key = None
        for jwk in jwks['keys']:
            if jwk['kid'] == header['kid']:
                key = jwk
                break
        
        if not key:
            return None
        
        # Prepare the public key
        public_key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(key))
        
        # Verify and decode the token
        decoded = jwt.decode(
            token,
            public_key,
            algorithms=['RS256'],
            audience=client_id,
            options={
                'verify_signature': True,
                'verify_aud': True,
                'verify_exp': True
            }
        )
        
        return decoded
    except jwt.PyJWTError as e:
        print(f"Token validation error: {e}")
        return None

def require_auth(f):
    """Decorator to require authentication for routes"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_header()
        if not token:
            return jsonify({'error': 'Authentication required'}), 401
        
        decoded_token = validate_token(token)
        if not decoded_token:
            return jsonify({'error': 'Invalid token'}), 401
        
        # Store user claims in Flask's g object for access in the route
        g.user = decoded_token
        
        return f(*args, **kwargs)
    return decorated
