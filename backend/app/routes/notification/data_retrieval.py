from datetime import datetime, timedelta
import json
import sqlite3
import os

from app.database import find_tenant_database, get_all_tenant_databases

def fetch_message_center_updates(tenant_id, frequency, check_period=True, force_exact_date=False):
    """Fetch Message Center updates for a tenant with frequency filtering"""
    print(f"Fetching Message Center updates for tenant {tenant_id} with frequency {frequency}")
    print(f"Check period: {check_period}, Force exact date: {force_exact_date}")
    
    try:
        # Get all tenant databases
        tenant_databases = get_all_tenant_databases(tenant_id)
        
        # Determine which database to use
        if 'tenant' in tenant_databases:
            tenant_db_path = tenant_databases['tenant']
        else:
            tenant_db_path = find_tenant_database(tenant_id)
        
        if not tenant_db_path:
            print(f"No database found for tenant {tenant_id}")
            return []
        
        print(f"Using database: {tenant_db_path}")
        
        # Connect to the database
        conn = sqlite3.connect(tenant_db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Check if the message_center_updates table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='message_center_updates'")
        if not cursor.fetchone():
            print(f"message_center_updates table not found in database {tenant_db_path}")
            return []
        
        # Determine the date range based on frequency
        now = datetime.now()
        cutoff_date = None
        
        if check_period:
            if frequency == 'Daily':
                # Get updates from the last day
                cutoff_date = now - timedelta(days=1)
                print(f"Using daily cutoff: {cutoff_date}")
            elif frequency in ['Weekly', 'Monthly']:
                # Get updates from the last week or month
                days = 7 if frequency == 'Weekly' else 30
                cutoff_date = now - timedelta(days=days)
                print(f"Using {frequency} cutoff: {cutoff_date}")
            else:
                # Default to 10 days
                cutoff_date = now - timedelta(days=10)
                print(f"Using default 10-day cutoff: {cutoff_date}")
            
            # If forcing exact date filter, set to start of day
            if force_exact_date:
                cutoff_date = datetime(cutoff_date.year, cutoff_date.month, cutoff_date.day, 0, 0, 0)
                print(f"Using exact date cutoff: {cutoff_date}")
                
                # Query with filtered date range
                cursor.execute('''
                    SELECT * FROM message_center_updates
                    WHERE datetime(publishedDate) >= datetime(?)
                    ORDER BY publishedDate DESC
                ''', (cutoff_date.isoformat(),))
            else:
                # Use date string comparison (less precise but more compatible)
                cutoff_date_str = cutoff_date.strftime('%Y-%m-%d')
                print(f"Using string date cutoff: {cutoff_date_str}")
                
                # Query with filtered date range using string comparison
                cursor.execute('''
                    SELECT * FROM message_center_updates
                    WHERE publishedDate >= ?
                    ORDER BY publishedDate DESC
                ''', (cutoff_date_str,))
        else:
            # If not checking period, get all updates
            print("Not applying date filtering, fetching all updates")
            cursor.execute('''
                SELECT * FROM message_center_updates
                ORDER BY publishedDate DESC
            ''')
        
        updates = []
        for row in cursor.fetchall():
            updates.append(dict(row))
        
        conn.close()
        print(f"Found {len(updates)} message center updates after date filtering")
        return updates
    
    except sqlite3.Error as e:
        print(f"SQLite error in fetch_message_center_updates: {e}")
        return []
    except Exception as e:
        print(f"Error in fetch_message_center_updates: {e}")
        return []

def fetch_windows_updates(tenant_id, frequency, check_period=True, force_exact_date=False):
    """Fetch Windows updates for a tenant with frequency filtering"""
    print(f"Fetching Windows updates for tenant {tenant_id} with frequency {frequency}")
    print(f"Check period: {check_period}, Force exact date: {force_exact_date}")
    
    try:
        # Get all tenant databases
        tenant_databases = get_all_tenant_databases(tenant_id)
        
        # Determine which database to use
        if 'tenant' in tenant_databases:
            tenant_db_path = tenant_databases['tenant']
        else:
            tenant_db_path = find_tenant_database(tenant_id)
        
        if not tenant_db_path:
            print(f"No database found for tenant {tenant_id}")
            return []
        
        print(f"Using database: {tenant_db_path}")
        
        # Connect to the database
        conn = sqlite3.connect(tenant_db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Check if the windows_updates table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='windows_updates'")
        if not cursor.fetchone():
            print(f"windows_updates table not found in database {tenant_db_path}")
            return []
        
        # Determine the date range based on frequency
        now = datetime.now()
        cutoff_date = None
        
        if check_period:
            if frequency == 'Daily':
                # Get updates from the last day
                cutoff_date = now - timedelta(days=1)
                print(f"Using daily cutoff: {cutoff_date}")
            elif frequency in ['Weekly', 'Monthly']:
                # Get updates from the last week or month
                days = 7 if frequency == 'Weekly' else 30
                cutoff_date = now - timedelta(days=days)
                print(f"Using {frequency} cutoff: {cutoff_date}")
            else:
                # Default to 10 days
                cutoff_date = now - timedelta(days=10)
                print(f"Using default 10-day cutoff: {cutoff_date}")
            
            # If forcing exact date filter, set to start of day
            if force_exact_date:
                cutoff_date = datetime(cutoff_date.year, cutoff_date.month, cutoff_date.day, 0, 0, 0)
                print(f"Using exact date cutoff: {cutoff_date}")
                
                # Query with filtered date range
                cursor.execute('''
                    SELECT * FROM windows_updates
                    WHERE datetime(startDate) >= datetime(?)
                    ORDER BY startDate DESC
                ''', (cutoff_date.isoformat(),))
            else:
                # Use date string comparison (less precise but more compatible)
                cutoff_date_str = cutoff_date.strftime('%Y-%m-%d')
                print(f"Using string date cutoff: {cutoff_date_str}")
                
                # Query with filtered date range using string comparison
                cursor.execute('''
                    SELECT * FROM windows_updates
                    WHERE startDate >= ?
                    ORDER BY startDate DESC
                ''', (cutoff_date_str,))
        else:
            # If not checking period, get all updates
            print("Not applying date filtering, fetching all updates")
            cursor.execute('''
                SELECT * FROM windows_updates
                ORDER BY startDate DESC
            ''')
        
        updates = []
        for row in cursor.fetchall():
            updates.append(dict(row))
        
        conn.close()
        print(f"Found {len(updates)} windows updates after date filtering")
        return updates
    
    except sqlite3.Error as e:
        print(f"SQLite error in fetch_windows_updates: {e}")
        return []
    except Exception as e:
        print(f"Error in fetch_windows_updates: {e}")
        return []

def fetch_m365_news(tenant_id, frequency, check_period=True, force_exact_date=False):
    """Fetch Microsoft 365 news for a tenant with frequency filtering"""
    print(f"Fetching M365 news for tenant {tenant_id} with frequency {frequency}")
    print(f"Check period: {check_period}, Force exact date: {force_exact_date}")
    
    try:
        # Get all tenant databases
        tenant_databases = get_all_tenant_databases(tenant_id)
        
        # Determine which database to use
        if 'tenant' in tenant_databases:
            tenant_db_path = tenant_databases['tenant']
        else:
            tenant_db_path = find_tenant_database(tenant_id)
        
        if not tenant_db_path:
            print(f"No database found for tenant {tenant_id}")
            return []
        
        print(f"Using database: {tenant_db_path}")
        
        # Connect to the database
        conn = sqlite3.connect(tenant_db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Check if the m365_news table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='m365_news'")
        if not cursor.fetchone():
            print(f"m365_news table not found in database {tenant_db_path}")
            return []
        
        # Determine the date range based on frequency
        now = datetime.now()
        cutoff_date = None
        
        if check_period:
            if frequency == 'Daily':
                # Get news from the last day
                cutoff_date = now - timedelta(days=1)
                print(f"Using daily cutoff: {cutoff_date}")
            elif frequency in ['Weekly', 'Monthly']:
                # Get news from the last week or month
                days = 7 if frequency == 'Weekly' else 30
                cutoff_date = now - timedelta(days=days)
                print(f"Using {frequency} cutoff: {cutoff_date}")
            else:
                # Default to 10 days
                cutoff_date = now - timedelta(days=10)
                print(f"Using default 10-day cutoff: {cutoff_date}")
            
            # If forcing exact date filter, set to start of day
            if force_exact_date:
                cutoff_date = datetime(cutoff_date.year, cutoff_date.month, cutoff_date.day, 0, 0, 0)
                print(f"Using exact date cutoff: {cutoff_date}")
                
                # Query with filtered date range
                cursor.execute('''
                    SELECT * FROM m365_news
                    WHERE datetime(published_date) >= datetime(?)
                    ORDER BY published_date DESC
                ''', (cutoff_date.isoformat(),))
            else:
                # Use date string comparison (less precise but more compatible)
                cutoff_date_str = cutoff_date.strftime('%Y-%m-%d')
                print(f"Using string date cutoff: {cutoff_date_str}")
                
                # Query with filtered date range using string comparison
                cursor.execute('''
                    SELECT * FROM m365_news
                    WHERE published_date >= ?
                    ORDER BY published_date DESC
                ''', (cutoff_date_str,))
        else:
            # If not checking period, get all news items
            print("Not applying date filtering, fetching all news")
            cursor.execute('''
                SELECT * FROM m365_news
                ORDER BY published_date DESC
            ''')
        
        news_items = []
        for row in cursor.fetchall():
            news_item = dict(row)
            
            # Parse categories from JSON
            if 'categories' in news_item and news_item['categories']:
                try:
                    if isinstance(news_item['categories'], str):
                        news_item['categories'] = json.loads(news_item['categories'])
                except (json.JSONDecodeError, TypeError) as e:
                    print(f"Error parsing categories JSON: {e}")
                    news_item['categories'] = []
            else:
                news_item['categories'] = []
            
            news_items.append(news_item)
        
        conn.close()
        print(f"Found {len(news_items)} news items after date filtering")
        return news_items
    
    except sqlite3.Error as e:
        print(f"SQLite error in fetch_m365_news: {e}")
        return []
    except Exception as e:
        print(f"Error in fetch_m365_news: {e}")
        return []
