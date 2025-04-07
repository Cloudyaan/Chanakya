import sqlite3
from datetime import datetime, timedelta
from dateutil import parser

from app.database import find_tenant_database
from .db_helpers import ensure_tenant_database

def get_time_period_for_frequency(frequency, check_period=True):
    """Get the appropriate time period based on notification frequency"""
    if not check_period:
        # Default to 7 days if not checking period (backward compatibility)
        return 7
    
    # Return days based on frequency
    if frequency == "Daily":
        return 1  # Last 24 hours for daily
    elif frequency in ["Weekly", "Monthly"]:
        return 7  # Last 7 days for weekly and monthly
    else:
        return 7  # Default to 7 days for any other frequency

def get_exact_date_for_filter(frequency):
    """Get the exact date to filter from based on frequency"""
    now = datetime.now()
    
    if frequency == "Daily":
        # Use beginning of yesterday (00:00:00)
        yesterday_start = (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        return yesterday_start.isoformat()
    elif frequency in ["Weekly", "Monthly"]:
        # Use beginning of 7 days ago (00:00:00)
        week_ago_start = (now - timedelta(days=7)).replace(hour=0, minute=0, second=0, microsecond=0)
        return week_ago_start.isoformat()
    else:
        # Default to beginning of yesterday
        yesterday_start = (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        return yesterday_start.isoformat()

def fetch_message_center_updates(tenant_id, frequency="Daily", check_period=True, force_exact_date=False):
    """Fetch message center updates for a tenant for the appropriate time period"""
    # Get days based on frequency
    days = get_time_period_for_frequency(frequency, check_period)
    print(f"Fetching message center updates for last {days} days based on {frequency} frequency")
    
    # Ensure the tenant database exists
    db_path = find_tenant_database(tenant_id)
    if not db_path:
        db_path = ensure_tenant_database(tenant_id)
        if not db_path:
            return []
    
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Check which table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND (name='updates' OR name='announcements')")
        table_result = cursor.fetchone()
        
        if not table_result:
            return []
            
        table_name = table_result['name']
        
        # Calculate the date range
        if force_exact_date:
            # Use exact date (beginning of yesterday for daily)
            cutoff_date = get_exact_date_for_filter(frequency)
            print(f"Filtering updates using exact date filter since: {cutoff_date}")
        else:
            # Use relative time from now (for backward compatibility)
            cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
            print(f"Filtering updates since: {cutoff_date}")
        
        # Query based on which table exists
        if table_name == 'updates':
            cursor.execute(f"""
                SELECT 
                    id, title, category, severity, lastModifiedDateTime as publishedDate,
                    isMajorChange as actionType, bodyContent as description
                FROM updates
                WHERE lastModifiedDateTime > ?
                ORDER BY lastModifiedDateTime DESC
            """, (cutoff_date,))
        else:  # announcements
            cursor.execute(f"""
                SELECT 
                    id, title, category, severity, lastModifiedDateTime as publishedDate,
                    isMajorChange as actionType, bodyContent as description
                FROM announcements
                WHERE lastModifiedDateTime > ?
                ORDER BY lastModifiedDateTime DESC
            """, (cutoff_date,))
        
        updates = [dict(row) for row in cursor.fetchall()]
        conn.close()
        print(f"Found {len(updates)} message center updates since {cutoff_date}")
        return updates
    except Exception as e:
        print(f"Error fetching message center updates: {e}")
        return []

def fetch_windows_updates(tenant_id, frequency="Daily", check_period=True, force_exact_date=False):
    """Fetch Windows updates for a tenant for the appropriate time period"""
    # Get days based on frequency
    days = get_time_period_for_frequency(frequency, check_period)
    print(f"Fetching Windows updates for last {days} days based on {frequency} frequency")
    
    # Ensure the tenant database exists
    db_path = find_tenant_database(tenant_id)
    if not db_path:
        db_path = ensure_tenant_database(tenant_id)
        if not db_path:
            return []
    
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Check if the windows_known_issues table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='windows_known_issues'")
        if not cursor.fetchone():
            return []
        
        # Calculate the date range
        if force_exact_date:
            # Use exact date (beginning of yesterday for daily)
            cutoff_date = get_exact_date_for_filter(frequency)
            print(f"Filtering Windows updates using exact date filter since: {cutoff_date}")
        else:
            # Use relative time from now (for backward compatibility)
            cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
            print(f"Filtering Windows updates since: {cutoff_date}")
        
        cursor.execute("""
            SELECT 
                wi.id, wi.product_id as productId, wi.title, wi.description, 
                wi.webViewUrl, wi.status, wi.start_date as startDate, 
                wi.resolved_date as resolvedDate, wp.name as productName
            FROM windows_known_issues wi
            LEFT JOIN windows_products wp ON wi.product_id = wp.id
            WHERE wi.start_date > ?
            ORDER BY wi.start_date DESC
        """, (cutoff_date,))
        
        updates = [dict(row) for row in cursor.fetchall()]
        conn.close()
        print(f"Found {len(updates)} Windows updates since {cutoff_date}")
        return updates
    except Exception as e:
        print(f"Error fetching Windows updates: {e}")
        return []

def fetch_m365_news(tenant_id, frequency="Daily", check_period=True, force_exact_date=False):
    """Fetch M365 news for a tenant for the appropriate time period"""
    # Get days based on frequency
    days = get_time_period_for_frequency(frequency, check_period)
    print(f"Fetching M365 news for last {days} days based on {frequency} frequency")
    
    # Ensure the tenant database exists
    db_path = find_tenant_database(tenant_id)
    if not db_path:
        db_path = ensure_tenant_database(tenant_id)
        if not db_path:
            return []
    
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Check if the m365_news table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='m365_news'")
        if not cursor.fetchone():
            return []
        
        # Calculate the cutoff date
        if force_exact_date:
            # Use exact date (beginning of yesterday for daily)
            cutoff_date_str = get_exact_date_for_filter(frequency)
            print(f"Filtering M365 news using exact date filter since: {cutoff_date_str}")
            cutoff_date = datetime.fromisoformat(cutoff_date_str)
        else:
            # Use relative time from now
            cutoff_date = datetime.now() - timedelta(days=days)
            print(f"Filtering M365 news since: {cutoff_date.isoformat()}")
        
        # Get all news entries first
        cursor.execute("SELECT * FROM m365_news ORDER BY published_date DESC")
        all_news = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        # Filter the news entries manually based on the date
        filtered_news = []
        for news_item in all_news:
            try:
                # Parse the date using dateutil.parser which handles various formats
                published_date_str = news_item.get('published_date')
                if not published_date_str:
                    continue
                    
                published_date = parser.parse(published_date_str)
                
                # Make both dates timezone-naive for comparison if published_date has timezone
                if published_date.tzinfo:
                    published_date = published_date.replace(tzinfo=None)
                
                # Compare dates
                if published_date >= cutoff_date:
                    filtered_news.append(news_item)
            except Exception as e:
                print(f"Error parsing date '{published_date_str}': {e}")
                # Skip items with invalid dates
                continue
        
        print(f"Found {len(filtered_news)} M365 news items out of {len(all_news)} total after date filtering")
        return filtered_news
    except Exception as e:
        print(f"Error fetching M365 news: {e}")
        return []
