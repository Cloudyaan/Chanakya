
import threading
import time
import schedule
from datetime import datetime, timedelta
from app.database import get_db_connection
import subprocess
import os
import sys

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
            print("Tenant data scheduler started successfully")
    
    def stop(self):
        """Stop the scheduler service"""
        self.running = False
        schedule.clear()
        print("Tenant data scheduler stopped")
    
    def _run_scheduler(self):
        """Main scheduler loop"""
        # Schedule the check every 30 minutes (more frequent checking)
        schedule.every(30).minutes.do(self._check_and_run_tasks)
        
        print("Scheduler running - checking every 30 minutes for auto-fetch tasks")
        
        while self.running:
            try:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
            except Exception as e:
                print(f"Error in scheduler loop: {e}")
                time.sleep(60)  # Continue running even if there's an error
    
    def _check_and_run_tasks(self):
        """Check which tenants need data fetching and run the appropriate tasks"""
        try:
            print(f"Checking for scheduled auto-fetch tasks at {datetime.now()}")
            
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Get all active tenants with auto-fetch enabled
            cursor.execute('''
                SELECT id, name, tenantId, autoFetchEnabled, scheduleValue, scheduleUnit 
                FROM tenants 
                WHERE isActive = 1 AND autoFetchEnabled = 1
            ''')
            
            tenants = cursor.fetchall()
            cursor.close()
            conn.close()
            
            if not tenants:
                print("No tenants with auto-fetch enabled found")
                return
            
            print(f"Found {len(tenants)} tenants with auto-fetch enabled")
            
            for tenant in tenants:
                tenant_id = tenant[0]
                tenant_name = tenant[1]
                tenant_azure_id = tenant[2]
                auto_fetch_enabled = bool(tenant[3])
                schedule_value = tenant[4] if len(tenant) > 4 and tenant[4] else 1
                schedule_unit = tenant[5] if len(tenant) > 5 and tenant[5] else 'hours'
                
                if not auto_fetch_enabled:
                    continue
                
                # Convert schedule to hours for unified checking
                interval_hours = schedule_value
                if schedule_unit == 'days':
                    interval_hours = schedule_value * 24
                
                print(f"Checking schedule for tenant {tenant_name} (ID: {tenant_id}):")
                print(f"  Schedule: Every {schedule_value} {schedule_unit} (equivalent to {interval_hours} hours)")
                
                # Check if it's time to fetch data for all update types
                if self._should_fetch_data('unified_updates', tenant_id, interval_hours):
                    print(f"✓ Time to fetch data for tenant {tenant_name}")
                    self._fetch_all_data(tenant_id, tenant_name, tenant_azure_id)
                else:
                    print(f"  Not yet time to fetch data for tenant {tenant_name}")
                    
        except Exception as e:
            print(f"Error in scheduler check: {e}")
            import traceback
            traceback.print_exc()
    
    def _should_fetch_data(self, data_type, tenant_id, interval_hours):
        """Check if it's time to fetch data based on the last fetch time"""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Create tracking table if it doesn't exist
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
                print(f"    First time fetching for tenant {tenant_id}, proceeding with fetch")
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
            time_diff_hours = time_diff.total_seconds() / 3600
            should_fetch = time_diff_hours >= interval_hours
            
            print(f"    Last fetch: {last_fetch}")
            print(f"    Time since last fetch: {time_diff_hours:.2f} hours")
            print(f"    Required interval: {interval_hours} hours")
            print(f"    Should fetch: {should_fetch}")
            
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
    
    def _fetch_all_data(self, tenant_id, tenant_name, tenant_azure_id):
        """Fetch all data types (message center, windows updates, and news) for a tenant"""
        try:
            print(f"🚀 Starting auto-fetch for tenant {tenant_name} (Azure ID: {tenant_azure_id})")
            
            # Get the directory where the script is located
            script_dir = os.path.dirname(os.path.abspath(__file__))
            
            # Fetch message center data
            print(f"  📧 Fetching message center data...")
            try:
                if os.name == 'nt':  # Windows
                    result = subprocess.run(
                        [os.path.join(script_dir, 'fetch_updates.bat'), tenant_id], 
                        cwd=script_dir,
                        capture_output=True, 
                        text=True, 
                        timeout=300
                    )
                else:  # Unix/Linux
                    result = subprocess.run(
                        [sys.executable, os.path.join(script_dir, 'fetch_updates.py'), tenant_id], 
                        cwd=script_dir,
                        capture_output=True, 
                        text=True, 
                        timeout=300
                    )
                
                if result.returncode == 0:
                    print(f"     ✓ Message center data fetched successfully")
                else:
                    print(f"     ✗ Message center fetch failed: {result.stderr}")
                    
            except subprocess.TimeoutExpired:
                print(f"     ✗ Message center fetch timed out")
            except Exception as e:
                print(f"     ✗ Message center fetch error: {e}")
            
            # Fetch Windows updates data
            print(f"  🪟 Fetching Windows updates data...")
            try:
                if os.name == 'nt':  # Windows
                    result = subprocess.run(
                        [os.path.join(script_dir, 'fetch_windows_updates.bat'), tenant_id], 
                        cwd=script_dir,
                        capture_output=True, 
                        text=True, 
                        timeout=300
                    )
                else:  # Unix/Linux
                    result = subprocess.run(
                        [sys.executable, os.path.join(script_dir, 'fetch_windows_updates.py'), tenant_id], 
                        cwd=script_dir,
                        capture_output=True, 
                        text=True, 
                        timeout=300
                    )
                
                if result.returncode == 0:
                    print(f"     ✓ Windows updates data fetched successfully")
                else:
                    print(f"     ✗ Windows updates fetch failed: {result.stderr}")
                    
            except subprocess.TimeoutExpired:
                print(f"     ✗ Windows updates fetch timed out")
            except Exception as e:
                print(f"     ✗ Windows updates fetch error: {e}")
            
            # Fetch news data
            print(f"  📰 Fetching M365 news data...")
            try:
                if os.name == 'nt':  # Windows
                    result = subprocess.run(
                        [os.path.join(script_dir, 'fetch_m365_news.bat'), tenant_id], 
                        cwd=script_dir,
                        capture_output=True, 
                        text=True, 
                        timeout=300
                    )
                else:  # Unix/Linux
                    result = subprocess.run(
                        [sys.executable, os.path.join(script_dir, 'fetch_m365_news.py'), tenant_id], 
                        cwd=script_dir,
                        capture_output=True, 
                        text=True, 
                        timeout=300
                    )
                
                if result.returncode == 0:
                    print(f"     ✓ M365 news data fetched successfully")
                else:
                    print(f"     ✗ M365 news fetch failed: {result.stderr}")
                    
            except subprocess.TimeoutExpired:
                print(f"     ✗ M365 news fetch timed out")
            except Exception as e:
                print(f"     ✗ M365 news fetch error: {e}")
                
            print(f"🎉 Completed auto-fetch for tenant {tenant_name}")
            
        except Exception as e:
            print(f"❌ Error during auto-fetch for {tenant_name}: {e}")
            import traceback
            traceback.print_exc()

# Global scheduler instance
scheduler = TenantDataScheduler()
