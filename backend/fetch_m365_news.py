
import feedparser
import requests
import sqlite3
import sys
import os
import json
from datetime import datetime, timedelta
from dateutil import parser

# Configuration
RSS_FEEDS = [
    "https://www.microsoft.com/releasecommunications/api/v2/m365/rss",
]

# Common headers to mimic a browser
COMMON_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'application/xml, text/xml, */*',
    'Accept-Language': 'en-US,en;q=0.9',
}

def get_db_connection(tenant_id):
    """Connect to the tenant's database"""
    from app.database import find_tenant_database, get_db_connection
    
    # First get connection to main database
    main_conn = get_db_connection()
    cursor = main_conn.cursor()
    
    # Find the tenant
    tenant = cursor.execute('SELECT * FROM tenants WHERE id = ?', (tenant_id,)).fetchone()
    main_conn.close()
    
    if not tenant:
        print(f"Error: No tenant found with ID {tenant_id}")
        sys.exit(1)
    
    # Find the tenant database file
    tenant_db_path = find_tenant_database(tenant['tenantId'])
    
    if not tenant_db_path:
        print(f"Error: No database found for tenant {tenant['name']} (ID: {tenant_id})")
        sys.exit(1)
    
    # Connect to the tenant database
    try:
        conn = sqlite3.connect(tenant_db_path)
        conn.row_factory = sqlite3.Row
        return conn, tenant
    except sqlite3.Error as e:
        print(f"Database error: {str(e)}")
        sys.exit(1)

def ensure_news_table(conn):
    """Ensure the m365_news table exists in the database"""
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS m365_news (
            id TEXT PRIMARY KEY,
            title TEXT,
            published_date TEXT,
            link TEXT,
            summary TEXT,
            categories TEXT,
            fetch_date TEXT
        )
    """)
    conn.commit()

def fetch_rss_feed(url):
    try:
        response = requests.get(url,
                              headers=COMMON_HEADERS,
                              timeout=15)
        
        if response.status_code != 200:
            print(f"HTTP Error {response.status_code} for {url}")
            return None
            
        content_type = response.headers.get('Content-Type', '').lower()
        if 'html' in content_type and 'xml' not in content_type:
            print(f"Server returned HTML instead of XML for {url}")
            
        feed = feedparser.parse(response.content)
        
        if feed.bozo:
            print(f"Parse warning for {url}: {feed.bozo_exception}")
            if not feed.entries:
                return None
                
        return feed
        
    except Exception as e:
        print(f"Failed to fetch feed {url}: {str(e)}")
        return None

def filter_recent_entries(entries, days=10):
    cutoff_date = (datetime.now() - timedelta(days=days)).date()
    recent_entries = []
    
    for entry in entries:
        published_str = entry.get('published', None)
        if published_str:
            try:
                published_date = parser.parse(published_str).date()
                if published_date >= cutoff_date:
                    # Extract all categories for this entry
                    entry_categories = entry.get('tags', [])
                    categories = [tag.term if hasattr(tag, 'term') else tag for tag in entry_categories]
                    
                    # If no tags, try getting categories from the 'category' field
                    if not categories and hasattr(entry, 'category'):
                        categories = entry.category if isinstance(entry.category, list) else [entry.category]
                    
                    # Add the categories to the entry for display
                    entry['all_categories'] = categories
                    recent_entries.append(entry)
            except ValueError:
                print(f"Skipping entry with invalid date format: {published_str}")
    return recent_entries

def store_news(conn, entries):
    """Store news entries in the database"""
    cursor = conn.cursor()
    stored_count = 0
    
    for entry in entries:
        entry_id = entry.get('id', entry.get('link', None))
        if not entry_id:
            # Use a hash of the title and published date if no ID
            import hashlib
            entry_id = hashlib.md5(f"{entry.get('title', '')}-{entry.get('published', '')}".encode()).hexdigest()
        
        # Check if entry already exists
        existing = cursor.execute('SELECT id FROM m365_news WHERE id = ?', (entry_id,)).fetchone()
        if existing:
            continue  # Skip existing entries
        
        # Store the entry
        cursor.execute('''
            INSERT INTO m365_news (
                id, title, published_date, link, summary, categories, fetch_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            entry_id,
            entry.get('title', 'No title'),
            entry.get('published', datetime.now().isoformat()),
            entry.get('link', ''),
            entry.get('description', entry.get('summary', 'No summary')),
            json.dumps(entry.get('all_categories', [])),
            datetime.now().isoformat()
        ))
        stored_count += 1
    
    conn.commit()
    return stored_count

def main():
    if len(sys.argv) < 2:
        print("Error: Please provide a tenant ID")
        print("Usage: python fetch_m365_news.py <tenant_id>")
        sys.exit(1)
    
    tenant_id = sys.argv[1]
    print(f"Fetching M365 news for tenant ID: {tenant_id}")
    
    # Get tenant database connection
    conn, tenant = get_db_connection(tenant_id)
    ensure_news_table(conn)
    
    # Fetch updates from all RSS feeds
    all_updates = []
    for feed_url in RSS_FEEDS:
        print(f"\nFetching updates from: {feed_url}")
        feed = fetch_rss_feed(feed_url)
        if feed and feed.entries:
            recent_entries = filter_recent_entries(feed.entries, days=10)
            all_updates.extend(recent_entries)

    # Sort all updates by publication date (newest first)
    all_updates.sort(key=lambda x: parser.parse(x.get('published', '1970-01-01')), reverse=True)
    
    # Store the updates
    stored_count = store_news(conn, all_updates)
    print(f"Stored {stored_count} new updates in the database")
    
    conn.close()
    print("Completed successfully")

if __name__ == "__main__":
    # Add the backend directory to the Python path
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    main()
