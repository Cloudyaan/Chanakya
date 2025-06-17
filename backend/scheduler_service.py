
import threading
import time
import schedule
from datetime import datetime, timedelta
from app.database import get_db_connection
import subprocess
import os

class TenantDataScheduler:
    def __init__(self):
        self.running = False
        self.scheduler_thread = None
        
    def start(self):
        """Start the scheduler service"""
        if not self.running:
            self.running = True
            self.scheduler_thread = threading.Thread(target=self._run_scheduler, daemon=True)
            self.scheduler_thread.start()
            print("Tenant data scheduler started")
    
    def stop(self):
        """Stop the scheduler service"""
        self.running = False
        schedule.clear()
        print("Tenant data scheduler stopped")
    
    def _run_scheduler(self):
        """Main scheduler loop"""
        # Schedule the check every hour
        schedule.every().hour.do(self._check_and_run_tasks)
        
        while self.running:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
    
    def _check_and_run_tasks(self):
        """Check which tenants need data fetching and run the appropriate tasks"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Get all active tenants with auto-fetch enabled
            cursor.execute('''
                SELECT id, name, tenantId, autoFetchEnabled, messageCenterInterval, 
                       windowsUpdatesInterval, newsInterval 
                FROM tenants 
                WHERE isActive = 1 AND autoFetchEnabled = 1
            ''')
            
            tenants = cursor.fetchall()
            cursor.close()
            conn.close()
            
            current_time = datetime.now()
            print(f"Checking scheduled tasks at {current_time}")
            
            for tenant in tenants:
                tenant_id = tenant[0]
                tenant_name = tenant[1]
                tenant_azure_id = tenant[2]
                auto_fetch_enabled = bool(tenant[3])
                message_center_interval = tenant[4] if len(tenant) > 4 and tenant[4] else 24
                windows_updates_interval = tenant[5] if len(tenant) > 5 and tenant[5] else 24
                news_interval = tenant[6] if len(tenant) > 6 and tenant[6] else 24
                
                if not auto_fetch_enabled:
                    continue
                
                print(f"Checking intervals for tenant {tenant_name}:")
                print(f"  Message Center: {message_center_interval}h")
                print(f"  Windows Updates: {windows_updates_interval}h") 
                print(f"  News: {news_interval}h")
                
                # Check if it's time to fetch each type of data
                if self._should_fetch_data('message_center', tenant_id, message_center_interval):
                    self._fetch_message_center_data(tenant_id, tenant_name)
                
                if self._should_fetch_data('windows_updates', tenant_id, windows_updates_interval):
                    self._fetch_windows_updates_data(tenant_id, tenant_name)
                
                if self._should_fetch_data('news', tenant_id, news_interval):
                    self._fetch_news_data(tenant_id, tenant_name)
                    
        except Exception as e:
            print(f"Error in scheduler check: {e}")
    
    def _should_fetch_data(self, data_type, tenant_id, interval_hours):
        """Check if it's time to fetch data based on the last fetch time"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Check if we have a tracking table for scheduled fetches
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS scheduled_fetch_log (
                    id VARCHAR(50) PRIMARY KEY,
                    tenant_id VARCHAR(50),
                    data_type VARCHAR(50),
                    last_fetch_time DATETIME,
                    UNIQUE(tenant_id, data_type)
                )
            ''')
            
            # Get the last fetch time for this tenant and data type
            cursor.execute('''
                SELECT last_fetch_time FROM scheduled_fetch_log 
                WHERE tenant_id = ? AND data_type = ?
            ''', (tenant_id, data_type))
            
            result = cursor.fetchone()
            current_time = datetime.now()
            
            if result is None:
                # First time fetching, record current time and return True
                cursor.execute('''
                    INSERT OR REPLACE INTO scheduled_fetch_log 
                    (id, tenant_id, data_type, last_fetch_time) 
                    VALUES (?, ?, ?, ?)
                ''', (f"{tenant_id}_{data_type}", tenant_id, data_type, current_time.isoformat()))
                conn.commit()
                cursor.close()
                conn.close()
                return True
            
            last_fetch = datetime.fromisoformat(result[0])
            time_diff = current_time - last_fetch
            should_fetch = time_diff.total_seconds() >= (interval_hours * 3600)
            
            if should_fetch:
                # Update the last fetch time
                cursor.execute('''
                    UPDATE scheduled_fetch_log 
                    SET last_fetch_time = ? 
                    WHERE tenant_id = ? AND data_type = ?
                ''', (current_time.isoformat(), tenant_id, data_type))
                conn.commit()
            
            cursor.close()
            conn.close()
            return should_fetch
            
        except Exception as e:
            print(f"Error checking fetch time for {data_type}: {e}")
            return False
    
    def _fetch_message_center_data(self, tenant_id, tenant_name):
        """Fetch message center data for a tenant"""
        try:
            print(f"Fetching message center data for tenant {tenant_name}")
            if os.name == 'nt':
                subprocess.run(['fetch_updates.bat', tenant_id], check=False)
            else:
                subprocess.run(['python', 'fetch_updates.py', tenant_id], check=False)
        except Exception as e:
            print(f"Error fetching message center data for {tenant_name}: {e}")
    
    def _fetch_windows_updates_data(self, tenant_id, tenant_name):
        """Fetch Windows updates data for a tenant"""
        try:
            print(f"Fetching Windows updates data for tenant {tenant_name}")
            if os.name == 'nt':
                subprocess.run(['fetch_windows_updates.bat', tenant_id], check=False)
            else:
                subprocess.run(['python', 'fetch_windows_updates.py', tenant_id], check=False)
        except Exception as e:
            print(f"Error fetching Windows updates data for {tenant_name}: {e}")
    
    def _fetch_news_data(self, tenant_id, tenant_name):
        """Fetch news data for a tenant"""
        try:
            print(f"Fetching news data for tenant {tenant_name}")
            if os.name == 'nt':
                subprocess.run(['fetch_m365_news.bat', tenant_id], check=False)
            else:
                subprocess.run(['python', 'fetch_m365_news.py', tenant_id], check=False)
        except Exception as e:
            print(f"Error fetching news data for {tenant_name}: {e}")

# Global scheduler instance
scheduler = TenantDataScheduler()
