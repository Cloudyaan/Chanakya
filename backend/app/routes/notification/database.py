
import sqlite3
import json
import uuid
from datetime import datetime
from app.database import get_db_connection

def init_notification_table():
    """Initialize the notification_settings table if it doesn't exist."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS notification_settings (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        tenants TEXT NOT NULL,
        update_types TEXT NOT NULL,
        frequency TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    ''')
    
    conn.commit()
    conn.close()

# Helper function to ensure arrays are properly handled
def ensure_array(value):
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, list) else []
        except json.JSONDecodeError:
            return []
    return []

# Helper to normalize legacy 'Monthly' frequency to 'Weekly'
def normalize_frequency(frequency):
    return 'Weekly' if frequency == 'Monthly' else frequency
